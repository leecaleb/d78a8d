import sys
from django.db import models
from django.db.models import Q

from . import utils
from .conversation import Conversation
from .user import User

class ConversationUser(utils.CustomModel):
    userId = models.ForeignKey(
        User, on_delete=models.CASCADE, db_column="userId", related_name="+"
    )
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        db_column="conversationId",
        related_name="userList",
    )
    lastMessageReadId = models.IntegerField(null=False)
    createdAt = models.DateTimeField(auto_now_add=True, db_index=True)
    updatedAt = models.DateTimeField(auto_now=True)

    # find read receipt given converation ID and user ID
    def find_read_receipt(conversationId, userId):
        # return conversation or None if it doesn't exist
        try:
            return ConversationUser.objects.get(
                (Q(conversation__id=conversationId) & Q(userId=userId))
            )
        except ConversationUser.DoesNotExist:
            return None