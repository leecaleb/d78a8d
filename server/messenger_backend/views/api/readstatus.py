from django.contrib.auth.middleware import get_user
from django.http import HttpResponse, JsonResponse
from messenger_backend.models import Unread
from rest_framework.views import APIView
from rest_framework.request import Request


class ReadStatus(APIView):
    """"""

    def put(self, request: Request):
        try:
            user = get_user(request)

            if user.is_anonymous:
                return HttpResponse(status=401)
            user_id = user.id

            
            body = request.data
            conversation_id = body.get("conversationId")
            print ('conversation_id: ', conversation_id)
            print ('user_id: ', user_id)

            unread = Unread.find_unread_amount(conversation_id, user_id)
            print ('unread: ', unread)
            if unread:
                unread.unreadAmount = 0
                unread.save()

            return JsonResponse({
                "unreadAmount": unread.unreadAmount if unread else 0
            },
                safe=False,
            )
        except Exception as e:
            return HttpResponse(status=500)
