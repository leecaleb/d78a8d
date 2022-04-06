from django.contrib.auth.middleware import get_user
from django.http import HttpResponse, JsonResponse
from messenger_backend.models import Conversation, Message, Unread
from online_users import online_users
from rest_framework.views import APIView


class Messages(APIView):
    """expects {recipientId, text, conversationId } in body (conversationId will be null if no conversation exists yet)"""

    def post(self, request):
        try:
            user = get_user(request)

            if user.is_anonymous:
                return HttpResponse(status=401)

            sender_id = user.id
            body = request.data
            conversation_id = body.get("conversationId")
            text = body.get("text")
            recipient_id = body.get("recipientId")
            sender = body.get("sender")

            conversation = None
            if conversation_id:
                # if we already know conversation id, we can save time and just add it to message and return
                conversation = Conversation.objects.filter(id=conversation_id).first()
            else:
                # if we don't have conversation id, find a conversation to make sure it doesn't already exist
                conversation = Conversation.find_conversation(sender_id, recipient_id)

            if not conversation:
                # create conversation
                conversation = Conversation(user1_id=sender_id, user2_id=recipient_id)
                conversation.save()

                if sender and sender["id"] in online_users:
                    sender["online"] = True

            unread = Unread.find_unread_amount(conversation.id, recipient_id)
            if not unread:
                unread = Unread(userId=recipient_id, conversation=conversation, unreadAmount=1)
            else:
                unread.unreadAmount += 1
            unread.save()

            message = Message(senderId=sender_id, text=text, conversation=conversation)
            message.save()
            message_json = message.to_dict()
            return JsonResponse({"message": message_json, "sender": sender})
        except Exception as e:
            return HttpResponse(status=500)
