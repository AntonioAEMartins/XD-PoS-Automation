from typing import Optional

from prompt import get_message_enhancer_prompt
from src.order_processor.order_chain import ComandaData
from src.utils.groq import build_chat_groq
from src.utils.localization import (
    format_currency,
    get_language_labels,
    normalize_language,
)
from src.utils.settings import get_settings


class MessageBuilder:
    def __init__(self, order: ComandaData, language: Optional[str] = None):
        self.order = order
        settings = get_settings()
        self.language = normalize_language(language or settings.language)
        self.model = build_chat_groq()

    def build_message(self):
        labels = get_language_labels(self.language)
        message_parts = []

        for pedido in self.order.pedidos:
            item_message = (
                f"🍽 {pedido.nome_prato}\n"
                f"{pedido.quantidade} {labels['unit_label']} x "
                f"{format_currency(pedido.preco_unitario, self.language)} = "
                f"{format_currency(pedido.quantidade * pedido.preco_unitario, self.language)}"
            )
            message_parts.append(item_message)

        message_parts.append(labels["separator"])

        summary_message = (
            f"✨ {labels['service_fee']}: "
            f"{format_currency(self.order.valor_taxa_servico, self.language)}\n"
            f"💳 {labels['gross_total']}: "
            f"{format_currency(self.order.valor_total_bruto, self.language)}\n"
            # f"💸 *Desconto* (*{self.order.porcentagem_desconto}*%): -R$ {(self.order.valor_desconto):.2f}\n"
            # "\n-----------------------------------\n"
            # f"*🔹 Total com Desconto: R$ {self.order.valor_total_desconto:.2f}*"
        )
        message_parts.append(summary_message)

        final_message = "\n\n".join(message_parts)
        return final_message
    
    async def message_enhancer(self):
        message = self.build_message()

        chain = get_message_enhancer_prompt(self.language) | self.model

        response = await chain.ainvoke({"message": message})

        return response.content

    
    async def save_txt(self, filename):
        with open(filename, "w", encoding="utf-8") as f:
            f.write(await self.message_enhancer())
