#!/usr/bin/env python3
"""
노션 독서 리스트 마이그레이션 스크립트

각 책 페이지의 이미지와 텍스트를 기록정보 형식으로 구조화하여 추가합니다.
"""

import os
import sys
import json
import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

try:
    import requests
except ImportError:
    print("❌ requests 라이브러리가 필요합니다. 다음 명령어로 설치하세요:")
    print("   pip install requests")
    sys.exit(1)


@dataclass
class ImageTextPair:
    """이미지-텍스트 쌍"""
    image_url: str
    text: str


class NotionAPI:
    """Notion API 클라이언트"""
    
    def __init__(self, token: str):
        self.token = token
        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }
    
    def get_page(self, page_id: str) -> Dict:
        """페이지 정보 가져오기"""
        url = f"{self.base_url}/pages/{page_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_page_blocks(self, page_id: str) -> List[Dict]:
        """페이지의 모든 블록 가져오기"""
        url = f"{self.base_url}/blocks/{page_id}/children"
        all_blocks = []
        
        while True:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            all_blocks.extend(data.get("results", []))
            
            if not data.get("has_more"):
                break
            
            url = f"{self.base_url}/blocks/{page_id}/children?start_cursor={data['next_cursor']}"
        
        return all_blocks
    
    def append_blocks(self, page_id: str, blocks: List[Dict]) -> Dict:
        """페이지에 블록 추가"""
        url = f"{self.base_url}/blocks/{page_id}/children"
        payload = {"children": blocks}
        response = requests.patch(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()


def extract_image_url(block: Dict) -> Optional[str]:
    """블록에서 이미지 URL 추출"""
    if block.get("type") != "image":
        return None
    
    image = block.get("image", {})
    if image.get("type") == "external":
        return image.get("external", {}).get("url")
    elif image.get("type") == "file":
        return image.get("file", {}).get("url")
    return None


def extract_text(block: Dict) -> str:
    """블록에서 텍스트 추출"""
    text_content = []
    
    if block.get("type") == "paragraph":
        rich_text = block.get("paragraph", {}).get("rich_text", [])
        for text_item in rich_text:
            if text_item.get("type") == "text":
                text_content.append(text_item.get("plain_text", ""))
    
    return "\n".join(text_content).strip()


def parse_blocks_to_pairs(blocks: List[Dict]) -> List[ImageTextPair]:
    """블록들을 이미지-텍스트 쌍으로 파싱"""
    pairs = []
    current_image = None
    
    for block in blocks:
        block_type = block.get("type")
        
        # 이미지 블록 발견
        if block_type == "image":
            image_url = extract_image_url(block)
            if image_url:
                # 이전 이미지가 있으면 텍스트 없이 추가
                if current_image:
                    pairs.append(ImageTextPair(image_url=current_image, text=""))
                current_image = image_url
        
        # 텍스트 블록 발견
        elif block_type == "paragraph":
            text = extract_text(block)
            if text:
                if current_image:
                    # 이미지와 텍스트 쌍으로 추가
                    pairs.append(ImageTextPair(image_url=current_image, text=text))
                    current_image = None
                else:
                    # 이미지 없이 텍스트만 있는 경우는 무시 (기록정보에 포함하지 않음)
                    pass
        
        # 기타 블록 타입은 무시
    
    # 마지막 이미지가 남아있으면 추가
    if current_image:
        pairs.append(ImageTextPair(image_url=current_image, text=""))
    
    return pairs


def create_record_section_blocks(pairs: List[ImageTextPair]) -> List[Dict]:
    """기록정보 섹션 블록 생성"""
    blocks = []
    
    # 제목: 기록정보
    blocks.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "기록정보"}}]
        }
    })
    
    # 각 이미지-텍스트 쌍 추가
    for i, pair in enumerate(pairs):
        # 필사정보 제목
        blocks.append({
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [{"type": "text", "text": {"content": "필사정보"}}]
            }
        })
        
        # 이미지 블록
        blocks.append({
            "object": "block",
            "type": "image",
            "image": {
                "type": "external",
                "external": {"url": pair.image_url}
            }
        })
        
        # 내생각정보 제목
        blocks.append({
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [{"type": "text", "text": {"content": "내생각정보"}}]
            }
        })
        
        # 텍스트 블록 (텍스트가 있는 경우만)
        if pair.text:
            # 텍스트를 줄바꿈으로 분리
            lines = pair.text.split("\n")
            for line in lines:
                if line.strip():
                    blocks.append({
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [{"type": "text", "text": {"content": line.strip()}}]
                        }
                    })
        else:
            # 텍스트가 없으면 빈 문단 추가
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": []
                }
            })
        
        # 구분선 (마지막 쌍이 아닌 경우)
        if i < len(pairs) - 1:
            blocks.append({
                "object": "block",
                "type": "divider",
                "divider": {}
            })
    
    return blocks


def migrate_book(api: NotionAPI, page_id: str, book_title: str) -> bool:
    """단일 책 페이지 마이그레이션"""
    try:
        print(f"\n📖 처리 중: {book_title}")
        
        # 페이지 블록 가져오기
        blocks = api.get_page_blocks(page_id)
        print(f"   블록 {len(blocks)}개 발견")
        
        # 이미지-텍스트 쌍 추출
        pairs = parse_blocks_to_pairs(blocks)
        print(f"   이미지-텍스트 쌍 {len(pairs)}개 추출")
        
        if not pairs:
            print(f"   ⚠️  이미지가 없어서 건너뜁니다.")
            return False
        
        # 기록정보 섹션 블록 생성
        record_blocks = create_record_section_blocks(pairs)
        print(f"   기록정보 섹션 블록 {len(record_blocks)}개 생성")
        
        # 페이지에 추가
        api.append_blocks(page_id, record_blocks)
        print(f"   ✅ 성공적으로 추가되었습니다!")
        
        return True
        
    except Exception as e:
        print(f"   ❌ 오류 발생: {str(e)}")
        return False


def main():
    """메인 함수"""
    # 환경 변수에서 Notion API 토큰 가져오기
    notion_token = os.getenv("NOTION_API_TOKEN")
    if not notion_token:
        print("❌ NOTION_API_TOKEN 환경 변수가 설정되지 않았습니다.")
        print("\n설정 방법:")
        print("1. Notion에서 Integration 생성:")
        print("   https://www.notion.so/my-integrations")
        print("2. Integration에 '독서 리스트' 데이터베이스 접근 권한 부여")
        print("3. 환경 변수 설정:")
        print("   export NOTION_API_TOKEN='your_integration_token'")
        print("   또는 .env 파일에 추가:")
        print("   NOTION_API_TOKEN=your_integration_token")
        sys.exit(1)
    
    # API 클라이언트 생성
    api = NotionAPI(notion_token)
    
    # 마이그레이션할 책 목록
    books = [
        {
            "page_id": "18cfcf15-b6ad-8167-a571-f768b898058d",
            "title": "죽음의 수용소에서"
        },
        {
            "page_id": "28cfcf15-b6ad-8080-b1d0-d6cd428b4271",
            "title": "어린왕자"
        },
        {
            "page_id": "195fcf15-b6ad-8091-9c4e-dd7962ad33ed",
            "title": "넥서스"
        },
        {
            "page_id": "1b8fcf15-b6ad-8020-89f3-f72e8a3491b0",
            "title": "사랑의기술"
        },
        {
            "page_id": "18cfcf15-b6ad-81f3-8caa-f4921d88683b",
            "title": "기회의 심리학"
        },
        {
            "page_id": "18cfcf15-b6ad-8066-84af-ecbf1ab8cedc",
            "title": "지적대화를 위한 넓고 얕은 지식 1"
        },
    ]
    
    print("=" * 60)
    print("노션 독서 리스트 마이그레이션 시작")
    print("=" * 60)
    print(f"총 {len(books)}개 책 처리 예정\n")
    
    success_count = 0
    fail_count = 0
    
    for book in books:
        if migrate_book(api, book["page_id"], book["title"]):
            success_count += 1
        else:
            fail_count += 1
    
    print("\n" + "=" * 60)
    print("마이그레이션 완료")
    print("=" * 60)
    print(f"✅ 성공: {success_count}개")
    print(f"❌ 실패: {fail_count}개")
    print(f"📊 총계: {len(books)}개")


if __name__ == "__main__":
    main()
