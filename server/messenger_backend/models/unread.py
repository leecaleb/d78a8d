import sys
from django.db import models
from django.db.models import Q

from . import utils
from .conversation import Conversation
from .user import User

class Unread(utils.CustomModel):
    userId = models.IntegerField(null=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        db_column="conversationId",
        related_name="unreadAmount",
    )
    unreadAmount = models.IntegerField(null=False)
    createdAt = models.DateTimeField(auto_now_add=True, db_index=True)
    updatedAt = models.DateTimeField(auto_now=True)

    # find unreadAmount given converation ID and user ID
    def find_unread_amount(conversationId, userId):
        # return unread or None if it doesn't exist
        try:
            print ('conversationId, userId: ', conversationId, userId)
            return Unread.objects.get(
                (Q(conversation__id=conversationId) & Q(userId=userId))
            )
        except Unread.DoesNotExist:
            return None