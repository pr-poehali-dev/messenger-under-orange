import json
import os
import secrets
import psycopg2


def handler(event: dict, context) -> dict:
    """Проверяет SMS-код и создаёт сессию пользователя. Возвращает токен."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    body = json.loads(event.get("body") or "{}")
    phone = body.get("phone", "").strip()
    code = body.get("code", "").strip()
    name = body.get("name", "").strip()

    if not phone or not code:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Телефон и код обязательны"}),
        }

    # Нормализуем номер
    phone_digits = "".join(filter(str.isdigit, phone))
    if len(phone_digits) == 10:
        phone_digits = "7" + phone_digits
    if phone_digits.startswith("8"):
        phone_digits = "7" + phone_digits[1:]
    phone = "+" + phone_digits

    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # Проверяем код
    cur.execute(
        f"""SELECT id FROM {schema}.sms_codes
            WHERE phone = %s AND code = %s AND used = FALSE AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1""",
        (phone, code),
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Неверный или истёкший код"}),
        }

    code_id = row[0]

    # Помечаем код использованным
    cur.execute(f"UPDATE {schema}.sms_codes SET used = TRUE WHERE id = %s", (code_id,))

    # Создаём или находим пользователя
    cur.execute(f"SELECT id, name FROM {schema}.users WHERE phone = %s", (phone,))
    user = cur.fetchone()
    is_new = False

    if user:
        user_id = user[0]
        user_name = user[1]
        if name and not user_name:
            cur.execute(f"UPDATE {schema}.users SET name = %s WHERE id = %s", (name, user_id))
            user_name = name
    else:
        is_new = True
        user_name = name or ""
        cur.execute(
            f"INSERT INTO {schema}.users (phone, name) VALUES (%s, %s) RETURNING id",
            (phone, user_name),
        )
        user_id = cur.fetchone()[0]

    # Создаём сессию
    token = secrets.token_hex(32)
    cur.execute(
        f"INSERT INTO {schema}.sessions (user_id, token) VALUES (%s, %s)",
        (user_id, token),
    )
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "success": True,
            "token": token,
            "user": {
                "id": user_id,
                "phone": phone,
                "name": user_name,
            },
            "is_new": is_new,
        }),
    }
