from rest_framework import status
from rest_framework.test import APITestCase
from messenger_backend.models import User
import json

class ReadReceiptTestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user_dataA = User.objects.create(username="userA", email="testA@mail.com", password="123456")
        cls.user_dataB = User.objects.create(username="userB", email="testB@mail.com", password="123456")

    def setUp(self):
        userALoginRes = self.client.post("/auth/login", {"username": "userA", "password": "123456"}, format="json")
        self.assertEqual(userALoginRes.status_code, status.HTTP_200_OK)
        userBLoginRes = self.client.post("/auth/login", {"username": "userB", "password": "123456"}, format="json")
        self.assertEqual(userBLoginRes.status_code, status.HTTP_200_OK)
        self.user_dataA = userALoginRes.json()
        self.user_dataB = userBLoginRes.json()

    def test_not_authenticated_protected_endpoint(self):
        """Try to access a protected endpoint without a token"""
        data = { "conversationId": "12", "messageId": "1"}
        response = self.client.put(
            "/api/readreceipt",
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_conversation_does_not_exist_bad_request(self):
        """Try to access conversation that does not exist"""
        data = { "conversationId": "12", "messageId": "1"}
        response = self.client.put(
            "/api/readreceipt",
            data,
            format="json",
            **{"HTTP_X-ACCESS-TOKEN": self.user_dataB.get("token")},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unread_message_amount_after_sending_message(self):
        """User B should have 1 unread message"""
        
        # User A sends message to User B
        message_data = {
            "text": "first message",
            "recipientId": self.user_dataB["id"],
            "conversationId": None,
            "sender": self.user_dataA,
        }
        response = self.client.post("/api/messages", message_data, format="json", **{"HTTP_X-ACCESS-TOKEN": self.user_dataA.get("token")})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # User B should have 1 unread message
        response = self.client.get(
            "/api/conversations",
            **{"HTTP_X-ACCESS-TOKEN": self.user_dataB.get("token")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        jsonData = json.loads(response.content)
        self.assertEqual(len(jsonData), 1)
        self.assertEqual(jsonData[0]["unreadAmount"], 1)

    def test_unread_message_amount_after_reading_message(self):
        """Put /api/read/receipt should reinitialize unread message amount to 0"""

        # User A sends message to User B
        message_data = {
            "text": "first message",
            "recipientId": self.user_dataB["id"],
            "conversationId": None,
            "sender": self.user_dataA,
        }
        response = self.client.post("/api/messages", message_data, format="json", **{"HTTP_X-ACCESS-TOKEN": self.user_dataA.get("token")})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # prior to reading, unread message amount should be 1
        response = self.client.get(
            "/api/conversations",
            **{"HTTP_X-ACCESS-TOKEN": self.user_dataB.get("token")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        jsonData = json.loads(response.content)
        self.assertEqual(len(jsonData), 1)
        self.assertEqual(jsonData[0]["unreadAmount"], 1)

        # mark message with id: 1 read by user B
        data = { "conversationId": "1", "messageId": "1"}
        response = self.client.put(
            "/api/readreceipt",
            data,
            format="json",
            **{"HTTP_X-ACCESS-TOKEN": self.user_dataB.get("token")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # after marking message read, unread message amount should be 0
        response = self.client.get(
            "/api/conversations",
            **{"HTTP_X-ACCESS-TOKEN": self.user_dataB.get("token")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        jsonData = json.loads(response.content)
        self.assertEqual(len(jsonData), 1)
        self.assertEqual(jsonData[0]["unreadAmount"], 0)
