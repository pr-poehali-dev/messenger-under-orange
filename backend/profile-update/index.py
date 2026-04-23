import json
import os
import base64
import boto3
import psycopg2


def handler(event: dict, context) -> dict:
    """Обновляет профиль пользователя: имя, статус 'о себе', аватар (base64)."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token", "").strip()
    if not token:
        return {
            "statusCode": 401,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Необходима авторизация"}),
        }

    body = json.loads(event.get("body") or "{}")
    name = body.get("name", "").strip()
    about = body.get("about", "").strip()
    avatar_b64 = body.get("avatar_b64", "")

    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # Проверяем токен
    cur.execute(
        f"""SELECT s.user_id FROM {schema}.sessions s
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return {
            "statusCode": 401,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Сессия истекла, войдите снова"}),
        }

    user_id = row[0]
    avatar_url = ""

    # Загружаем аватар в S3 если передан
    if avatar_b64:
        try:
            image_data = base64.b64decode(avatar_b64)
            s3 = boto3.client(
                "s3",
                endpoint_url="https://bucket.poehali.dev",
                aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
            )
            key = f"avatars/user_{user_id}.jpg"
            s3.put_object(
                Bucket="files",
                Key=key,
                Body=image_data,
                ContentType="image/jpeg",
            )
            avatar_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        except Exception as e:
            cur.close()
            conn.close()
            return {
                "statusCode": 500,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": f"Ошибка загрузки фото: {str(e)}"}),
            }

    # Обновляем профиль
    if avatar_url:
        cur.execute(
            f"UPDATE {schema}.users SET name = %s, about = %s, avatar_url = %s WHERE id = %s",
            (name, about, avatar_url, user_id),
        )
    else:
        cur.execute(
            f"UPDATE {schema}.users SET name = %s, about = %s WHERE id = %s",
            (name, about, user_id),
        )

    cur.execute(
        f"SELECT id, phone, name, about, avatar_url FROM {schema}.users WHERE id = %s",
        (user_id,),
    )
    u = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "success": True,
            "user": {
                "id": u[0],
                "phone": u[1],
                "name": u[2],
                "about": u[3],
                "avatar_url": u[4] or "",
            },
        }),
    }
