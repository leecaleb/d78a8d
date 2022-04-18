from django.contrib.auth.middleware import get_user
from django.http import HttpResponse, JsonResponse
from messenger_backend.models import ReadReceipt, Conversation
from rest_framework.views import APIView
from rest_framework.request import Request

class ReadReceipts(APIView):
    """"""

    def put(self, request: Request):
        try:
            user = get_user(request)

            if user.is_anonymous:
                return HttpResponse(status=401)
            user_id = user.id

            
            body = request.data
            conversation_id = body.get("conversationId")
            message_id = body.get("messageId")

            read_receipt = ReadReceipt.find_read_receipt(conversation_id, user_id)
            if read_receipt:
                read_receipt.messageId = message_id
            else:
                conversation = Conversation.objects.filter(id=conversation_id).first()
                if conversation is None:
                    return HttpResponse(status=400)
                if conversation.user1.id != user_id and conversation.user2.id != user_id:
                    return HttpResponse(status=403)
                read_receipt = ReadReceipt(userId=user_id, conversation=conversation, messageId=message_id)
                
            read_receipt.save()

            return JsonResponse({
                "messageId": read_receipt.messageId if read_receipt else None
            },
                safe=False,
            )
        except Exception as e:
            return HttpResponse(status=500)
