from django.contrib.auth.middleware import get_user
from django.db.models import Max, Q
from django.db.models.query import Prefetch
from django.http import HttpResponse, JsonResponse
from messenger_backend.models import Conversation, Message, ReadReceipt
from online_users import online_users
from rest_framework.views import APIView
from rest_framework.request import Request


class Conversations(APIView):
    """get all conversations for a user, include latest message text for preview, and all messages
    include other user model so we have info on username/profile pic (don't include current user info)
    TODO: for scalability, implement lazy loading"""

    def get(self, request: Request):
        try:
            user = get_user(request)

            if user.is_anonymous:
                return HttpResponse(status=401)
            user_id = user.id

            conversations = (
                Conversation.objects.filter(Q(user1=user_id) | Q(user2=user_id))
                .prefetch_related(
                    Prefetch("readReceipt", queryset=ReadReceipt.objects.all())
                )
                .prefetch_related(
                    Prefetch(
                        "messages", queryset=Message.objects.order_by("-createdAt")
                    )
                )
                .all()
            )

            conversations_response = []

            for convo in conversations:
                convo_dict = {
                    "id": convo.id,
                    "messages": [
                        message.to_dict(["id", "text", "senderId", "createdAt"])
                        for message in convo.messages.all()
                    ],
                }

                # set properties for notification count and latest message preview
                convo_dict["latestMessageText"] = convo_dict["messages"][0]["text"]

                # set a property "otherUser" so that frontend will have easier access
                user_fields = ["id", "username", "photoUrl"]
                if convo.user1 and convo.user1.id != user_id:
                    convo_dict["otherUser"] = convo.user1.to_dict(user_fields)
                elif convo.user2 and convo.user2.id != user_id:
                    convo_dict["otherUser"] = convo.user2.to_dict(user_fields)

                # set property for online status of the other user
                if convo_dict["otherUser"]["id"] in online_users:
                    convo_dict["otherUser"]["online"] = True
                else:
                    convo_dict["otherUser"]["online"] = False

                convo_dict["messages"].sort(
                    key=lambda message: message['createdAt'],
                    reverse=False
                )

                other_user_read_receipt = convo.readReceipt.filter(userId=convo_dict["otherUser"]["id"]).first()
                my_read_receipt = convo.readReceipt.filter(userId=user_id).first()
                
                convo_dict["otherUser"]["lastReadMessageId"] = other_user_read_receipt.messageId if other_user_read_receipt else None
                # set property for amount of unread messages
                my_last_read_message_id = my_read_receipt.messageId if my_read_receipt else None
                convo_dict["unreadAmount"] = self.countUnreadMessages(user_id, convo_dict["messages"], my_last_read_message_id)

                conversations_response.append(convo_dict)

            conversations_response.sort(
                key=lambda convo: convo["messages"][-1]["createdAt"],
                reverse=True,
            )
            return JsonResponse(
                conversations_response,
                safe=False,
            )
        except Exception as e:
            return HttpResponse(status=500)

    def countUnreadMessages(self, user_id, messages, last_read_message_id):
        n = len(messages)
        cnt = 0
        for i in range(n-1, -1, -1):
            message = messages[i]
            if message["id"] == last_read_message_id:
                break

            if message["senderId"] != user_id:
                # sender is the other user, increment count
                cnt += 1
        return cnt
