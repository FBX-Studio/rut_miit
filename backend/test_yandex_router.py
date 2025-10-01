"""
Тестовый скрипт для проверки Yandex Router API
"""
import asyncio
import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

async def test_yandex_router():
    api_key = os.getenv("YANDEX_API_KEY") or os.getenv("YANDEX_MAPS_API_KEY")
    
    if not api_key:
        print("❌ API ключ не найден!")
        return
    
    print(f"🔑 API Key: {api_key[:10]}...")
    
    # Тестовый маршрут: Красная площадь -> ГУМ
    waypoints = [
        (55.7558, 37.6176),  # Красная площадь
        (55.7539, 37.6208),  # ГУМ
    ]
    
    router_url = "https://api.routing.yandex.net/v2/route"
    
    params = {
        "apikey": api_key,
    }
    
    points = []
    for lat, lon in waypoints:
        points.append({
            "type": "waypoint",
            "point": [lon, lat]
        })
    
    request_body = {
        "points": points,
        "options": {
            "mode": "driving",
            "traffic_mode": "enabled"
        }
    }
    
    print("\n📤 Отправка запроса к Yandex Router API...")
    print(f"URL: {router_url}")
    print(f"Points: {len(points)}")
    print(f"Request body: {json.dumps(request_body, indent=2, ensure_ascii=False)}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                router_url,
                params=params,
                json=request_body
            )
            
            print(f"\n📥 Статус ответа: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Успешный ответ!")
                print(f"Response keys: {list(data.keys())}")
                
                if "route" in data:
                    route = data["route"]
                    print(f"Route keys: {list(route.keys())}")
                    
                    if "distance" in route:
                        print(f"Distance: {route['distance'].get('value', 0) / 1000:.2f} km")
                    
                    if "duration" in route:
                        print(f"Duration: {route['duration'].get('value', 0) / 60:.1f} min")
                    
                    if "legs" in route:
                        print(f"Legs: {len(route['legs'])}")
                        if len(route['legs']) > 0:
                            first_leg = route['legs'][0]
                            print(f"First leg keys: {list(first_leg.keys())}")
                            
                            # Проверяем наличие геометрии
                            if "geometry" in first_leg:
                                print("✅ Geometry найдена в leg!")
                                geom = first_leg["geometry"]
                                print(f"Geometry keys: {list(geom.keys())}")
                                if "coordinates" in geom:
                                    print(f"Coordinates count: {len(geom['coordinates'])}")
                            
                            if "steps" in first_leg:
                                print(f"Steps: {len(first_leg['steps'])}")
                                if len(first_leg['steps']) > 0:
                                    first_step = first_leg['steps'][0]
                                    print(f"First step keys: {list(first_step.keys())}")
                
                # Выводим первые 1000 символов ответа
                print("\n📄 Начало ответа:")
                print(json.dumps(data, indent=2, ensure_ascii=False)[:1000])
                print("...")
            else:
                print(f"❌ Ошибка: {response.status_code}")
                print(f"Response: {response.text[:500]}")
    
    except Exception as e:
        print(f"❌ Исключение: {e}")

if __name__ == "__main__":
    asyncio.run(test_yandex_router())
