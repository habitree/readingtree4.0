"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8">프로젝트 설정 검증</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>shadcn/ui 컴포넌트 테스트</CardTitle>
          <CardDescription>모든 UI 컴포넌트가 정상 작동하는지 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Button 컴포넌트</h3>
            <div className="flex gap-2">
              <Button>기본 버튼</Button>
              <Button variant="secondary">보조 버튼</Button>
              <Button variant="destructive">삭제 버튼</Button>
              <Button variant="outline">아웃라인 버튼</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Input 컴포넌트</h3>
            <Input placeholder="입력 필드 테스트" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Tabs 컴포넌트</h3>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">탭 1</TabsTrigger>
                <TabsTrigger value="tab2">탭 2</TabsTrigger>
                <TabsTrigger value="tab3">탭 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">탭 1 내용</TabsContent>
              <TabsContent value="tab2">탭 2 내용</TabsContent>
              <TabsContent value="tab3">탭 3 내용</TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tailwind CSS 테스트</CardTitle>
          <CardDescription>Tailwind CSS 유틸리티 클래스가 정상 작동하는지 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg">
              Primary 색상
            </div>
            <div className="bg-secondary text-secondary-foreground p-4 rounded-lg">
              Secondary 색상
            </div>
            <div className="bg-accent text-accent-foreground p-4 rounded-lg">
              Accent 색상
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

