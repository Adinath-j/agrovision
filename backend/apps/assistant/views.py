from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.farms.models import Farm
from .models import ChatConversation, ChatMessage
from .assistant_service import build_farmer_context, get_ai_response

SUGGESTED_PROMPTS = {
    "en": [
        "What is the optimal sowing window for Soybean in my district?",
        "How should I split urea and potash for my soil type?",
        "How do I prevent fungal rust lesions on crop leaves?",
        "Which APMC mandi currently offers the best price?"
    ],
    "hi": [
        "मेरे जिले में सोयाबीन की बुवाई का सही समय क्या है?",
        "मेरी मिट्टी के लिए यूरिया और पोटाश कैसे देना चाहिए?",
        "फसलों की पत्तियों पर पीले धब्बे और फफूंद से कैसे बचें?",
        "निकटवर्ती मंडियों में आज का सबसे अच्छा भाव क्या है?"
    ],
    "mr": [
        "माझ्या जिल्ह्यामध्ये सोयाबीन पेरणीची योग्य वेळ कोणती?",
        "माझ्या जमिनीसाठी खतांची मात्रा व विभागणी कशी करावी?",
        "पानावरील तांबोरा व करपा रोगाचे नियंत्रण कसे करावे?",
        "जवळच्या कृषी उत्पन्न बाजार समितीत चालू बाजारभाव काय आहे?"
    ]
}

class ChatEndpointView(APIView):
    """
    Multilingual AI Farming Assistant chat endpoint.
    Grounded with farm soil, predictions, weather alerts, and APMC mandi telemetry.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        user_msg = data.get('message', '').strip()
        if not user_msg:
            return Response({"error": "Message content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        language = data.get('language') or getattr(user, 'preferred_language', 'en') or 'en'
        if language not in ['en', 'hi', 'mr']:
            language = 'en'

        farm_id = data.get('farm_id')
        farm = None
        if farm_id:
            farm = Farm.objects.filter(id=farm_id, owner=user).first()
        if not farm:
            farm = Farm.objects.filter(owner=user).first()

        # Retrieve or create conversation session
        conv_id = data.get('conversation_id')
        conversation = None
        if conv_id:
            conversation = ChatConversation.objects.filter(id=conv_id, farmer=user).first()

        if not conversation:
            title = user_msg[:45] + ("..." if len(user_msg) > 45 else "")
            conversation = ChatConversation.objects.create(
                farmer=user,
                farm=farm,
                title=title,
                language=language
            )

        # Build comprehensive real-time context
        context = build_farmer_context(user, farm)

        # Save user message
        ChatMessage.objects.create(
            conversation=conversation,
            sender=ChatMessage.Sender.FARMER,
            content=user_msg
        )

        # Generate intelligent agronomist response
        ai_reply = get_ai_response(user_msg, language=language, context=context)

        # Save assistant message
        ChatMessage.objects.create(
            conversation=conversation,
            sender=ChatMessage.Sender.ASSISTANT,
            content=ai_reply,
            context_used={
                "farm_name": context.get("farm_name"),
                "soil_type": context.get("soil_type"),
                "latest_yield": context.get("latest_yield"),
                "weather_alert": context.get("weather_alerts")
            }
        )

        return Response({
            "status": "success",
            "conversation_id": conversation.id,
            "language": language,
            "response": ai_reply,
            "suggested_prompts": SUGGESTED_PROMPTS.get(language, SUGGESTED_PROMPTS["en"]),
            "context_summary": {
                "farm": context.get("farm_name"),
                "district": context.get("district"),
                "latest_yield": context.get("latest_yield")
            }
        }, status=status.HTTP_200_OK)


class ChatHistoryView(APIView):
    """Retrieve chat history sessions for the logged-in farmer."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        conversations = ChatConversation.objects.filter(farmer=request.user).order_by('-updated_at')
        return Response({
            "count": conversations.count(),
            "sessions": [
                {
                    "id": c.id,
                    "title": c.title,
                    "language": c.language,
                    "updated_at": c.updated_at.strftime('%d %b, %H:%M'),
                    "message_count": c.messages.count()
                } for c in conversations
            ]
        })


class ConversationMessagesView(APIView):
    """Retrieve all messages inside a specific conversation."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conv_id):
        conversation = ChatConversation.objects.filter(id=conv_id, farmer=request.user).first()
        if not conversation:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        msgs = conversation.messages.order_by('created_at')
        return Response({
            "conversation_id": conversation.id,
            "title": conversation.title,
            "language": conversation.language,
            "messages": [
                {
                    "id": m.id,
                    "sender": m.sender,
                    "content": m.content,
                    "created_at": m.created_at.strftime('%H:%M')
                } for m in msgs
            ]
        })
