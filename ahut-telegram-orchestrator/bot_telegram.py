import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

# TODO: Importar Google Antigravity SDK e Skills locais quando integrados.

# Carrega variáveis de ambiente
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configuração de log
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Responde ao comando /start"""
    await update.message.reply_text("Saudações. Jarvis Orchestrator Chief online. Aguardando sua demanda.")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Recebe mensagens de texto e as repassa para o agente Orquestrador"""
    user_text = update.message.text
    
    # PLACEHOLDER: Aqui chamaremos o Jarvis via Antigravity SDK
    # resposta_jarvis = agente_jarvis.invoke(user_text)
    
    resposta_simulada = f"[Jarvis Processando] Recebi sua mensagem: '{user_text}'.\nAva será acionada para triagem."
    await update.message.reply_text(resposta_simulada)

def main():
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("ERRO: TELEGRAM_BOT_TOKEN não encontrado no .env")
        
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("Jarvis Bot escutando no Telegram...")
    app.run_polling()

if __name__ == "__main__":
    main()
