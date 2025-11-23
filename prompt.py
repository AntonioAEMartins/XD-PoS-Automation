from functools import lru_cache

from langchain_core.prompts import PromptTemplate

pedido_template = {
    "nome_prato": "String",
    "quantidade": "Int",
    "preco_unitario": "Float",
}

comanda_template = {
    "numero_comanda": "Int",
    "pedidos": [pedido_template],
}

_ORDER_PROCESS_TEMPLATES = {
    "pt-br": """
Responda somente em JSON.
Preencha o seguinte JSON exemplo:
{comanda_template}

Separe os itens seguindo o template: {pedido_template}
O pedido estará no formato NOME_ITEM'x' QUANTIDADE PRECO_UNITARIO = PRECO_TOTAL_ITEM
Caso não haja PRECO_UNITARIO, divida o PRECO_TOTAL_ITEM pela QUANTIDADE.

{comanda}
""",
    "en-us": """
Respond using JSON only.
Fill the following JSON example:
{comanda_template}

Split the items using the template: {pedido_template}
Each order line follows ITEM_NAME'x' QUANTITY UNIT_PRICE = LINE_TOTAL.
If UNIT_PRICE is missing, divide LINE_TOTAL by QUANTITY.

{comanda}
""",
}

consolidate_template = """
Resposta somente em JSON.

A partir do JSON fornecido, junte todos os pedidos que tiverem o mesmo nome e valor unitário.
Caso o valor unitário seja diferente, mantenha os pedidos separados.
Me retorne apenas o JSON com os pedidos consolidados.

{comanda_data}
"""

_MESSAGE_ENHANCER_TEMPLATES = {
    "pt-br": """
Altere os emojis de cada prato, adicionando emojis personalizados para cada prato.
Me retorne apenas o texto da mensagem com os emojis alterados, e as casas decimais utilizando virgula.

{message}
""",
    "en-us": """
Change the emojis for each dish, using custom emojis that match the meal.
Return only the message text with the updated emojis and use decimal points.

{message}
""",
}


@lru_cache(maxsize=None)
def get_order_process_prompt(language: str = "pt-br") -> PromptTemplate:
    template = _ORDER_PROCESS_TEMPLATES.get(language, _ORDER_PROCESS_TEMPLATES["pt-br"])
    return PromptTemplate.from_template(template)


@lru_cache(maxsize=None)
def get_message_enhancer_prompt(language: str = "pt-br") -> PromptTemplate:
    template = _MESSAGE_ENHANCER_TEMPLATES.get(language, _MESSAGE_ENHANCER_TEMPLATES["pt-br"])
    return PromptTemplate.from_template(template)


consolidate_prompt = PromptTemplate.from_template(consolidate_template)