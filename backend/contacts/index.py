import json
import os
import psycopg2


def get_user_from_token(cur, schema, token):
    cur.execute(
        f"SELECT user_id FROM {schema}.sessions WHERE token = %s AND expires_at > NOW()",
        (token,),
    )
    row = cur.fetchone()
    return row[0] if row else None


def normalize_phone(phone: str) -> str:
    digits = "".join(filter(str.isdigit, phone))
    if len(digits) == 10:
        digits = "7" + digits
    if digits.startswith("8"):
        digits = "7" + digits[1:]
    if not digits.startswith("7") or len(digits) != 11:
        return ""
    return "+" + digits


def handler(event: dict, context) -> dict:
    """
    Управление контактами пользователя.
    GET  / — список контактов
    POST /search — поиск пользователя по номеру телефона
    POST /add — добавить контакт по номеру
    DELETE /remove — удалить контакт
    """
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token", "").strip()
    method = event.get("httpMethod", "GET")
    path = event.get("path", "/").rstrip("/")

    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    user_id = get_user_from_token(cur, schema, token)
    if not user_id:
        cur.close()
        conn.close()
        return {
            "statusCode": 401,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Необходима авторизация"}),
        }

    # GET / — список контактов
    if method == "GET":
        cur.execute(
            f"""SELECT u.id, u.name, u.phone, u.about, u.avatar_url, c.nickname
                FROM {schema}.contacts c
                JOIN {schema}.users u ON u.id = c.contact_user_id
                WHERE c.owner_id = %s
                ORDER BY COALESCE(NULLIF(c.nickname,''), u.name) ASC""",
            (user_id,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        contacts = [
            {
                "id": r[0],
                "name": r[1] or "",
                "phone": r[2],
                "about": r[3] or "",
                "avatar_url": r[4] or "",
                "nickname": r[5] or "",
            }
            for r in rows
        ]
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"contacts": contacts}),
        }

    body = json.loads(event.get("body") or "{}")

    # POST /search — найти пользователя по номеру
    if method == "POST" and path.endswith("/search"):
        phone = normalize_phone(body.get("phone", ""))
        if not phone:
            cur.close()
            conn.close()
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Неверный номер телефона"}),
            }

        cur.execute(
            f"SELECT id, name, phone, about, avatar_url FROM {schema}.users WHERE phone = %s AND id != %s",
            (phone, user_id),
        )
        found = cur.fetchone()

        # Проверяем — уже в контактах?
        in_contacts = False
        if found:
            cur.execute(
                f"SELECT id FROM {schema}.contacts WHERE owner_id = %s AND contact_user_id = %s",
                (user_id, found[0]),
            )
            in_contacts = cur.fetchone() is not None

        cur.close()
        conn.close()

        if not found:
            return {
                "statusCode": 404,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Пользователь не найден"}),
            }

        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "user": {
                    "id": found[0],
                    "name": found[1] or "",
                    "phone": found[2],
                    "about": found[3] or "",
                    "avatar_url": found[4] or "",
                },
                "in_contacts": in_contacts,
            }),
        }

    # POST /add — добавить контакт
    if method == "POST" and path.endswith("/add"):
        contact_user_id = body.get("user_id")
        nickname = body.get("nickname", "").strip()
        if not contact_user_id:
            cur.close()
            conn.close()
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "user_id обязателен"}),
            }

        cur.execute(
            f"""INSERT INTO {schema}.contacts (owner_id, contact_user_id, nickname)
                VALUES (%s, %s, %s)
                ON CONFLICT (owner_id, contact_user_id) DO UPDATE SET nickname = EXCLUDED.nickname""",
            (user_id, contact_user_id, nickname),
        )
        conn.commit()
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"success": True}),
        }

    # POST /remove — удалить контакт
    if method == "POST" and path.endswith("/remove"):
        contact_user_id = body.get("user_id")
        if not contact_user_id:
            cur.close()
            conn.close()
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "user_id обязателен"}),
            }
        cur.execute(
            f"DELETE FROM {schema}.contacts WHERE owner_id = %s AND contact_user_id = %s",
            (user_id, contact_user_id),
        )
        conn.commit()
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"success": True}),
        }

    cur.close()
    conn.close()
    return {
        "statusCode": 404,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"error": "Не найдено"}),
    }
