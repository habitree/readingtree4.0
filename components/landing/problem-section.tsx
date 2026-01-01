import { Search, FileQuestion, Share } from "lucide-react";

export function ProblemSection() {
    return (
        <section className="py-24 bg-paper-50 text-charcoal-900 font-sans">
            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div>
                            <span className="text-forest-600 font-bold tracking-wider uppercase text-sm mb-4 block">The Problem</span>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-serif break-keep">
                                좋아서 읽었지만<br />
                                남는 건 <span className="text-forest-600 italic font-serif">피로감</span>뿐이라면?
                            </h2>
                        </div>
                        <p className="text-lg text-charcoal-600 leading-relaxed break-keep font-serif">
                            읽고 싶은 책은 쌓여만 가는데, 정리는 엄두가 안 나시나요? <br />
                            과거의 기록을 찾지 못해 같은 책을 또 샀던 경험, 한 번쯤 있으시죠?
                        </p>

                        <div className="grid gap-4">
                            {[
                                { title: "흩어진 기록", desc: "노션, 메모장, 일기장에 제각각", icon: <FileQuestion className="w-5 h-5" /> },
                                { title: "검색 불가", desc: "이미지로 찍어둔 문장은 찾을 수 없음", icon: <Search className="w-5 h-5" /> },
                                { title: "공유의 어려움", desc: "인스타에 올리려면 또 편집해야 함", icon: <Share className="w-5 h-5" /> }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center p-4 rounded-xl bg-white border border-paper-200 shadow-sm hover:border-forest-200 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-paper-100 flex items-center justify-center mr-4 text-forest-600 group-hover:bg-forest-50 transition-colors">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-charcoal-900 font-serif">{item.title}</h3>
                                        <p className="text-charcoal-500 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[500px] w-full bg-paper-200 rounded-3xl overflow-hidden border border-paper-300 flex items-center justify-center shadow-inner">
                        {/* Abstract Art for 'Chaos' */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/gplay.png')] opacity-10" />
                        <div className="relative z-10 text-center space-y-4 opacity-40 mix-blend-multiply">
                            <div className="grid grid-cols-2 gap-4 rotate-12 scale-110">
                                <div className="w-32 h-40 bg-white shadow-lg p-2 text-[6px] text-gray-400 overflow-hidden -rotate-6">
                                    Lorem ipsum dolor sit amet...
                                </div>
                                <div className="w-32 h-40 bg-yellow-50 shadow-lg p-2 text-[6px] text-gray-400 overflow-hidden rotate-3">
                                    독서 노트...
                                </div>
                                <div className="w-32 h-40 bg-blue-50 shadow-lg p-2 text-[6px] text-gray-400 overflow-hidden rotate-12">
                                    Page 24...
                                </div>
                                <div className="w-32 h-40 bg-white shadow-lg p-2 text-[6px] text-gray-400 overflow-hidden -rotate-12">
                                    Important...
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-paper-100 via-transparent to-transparent" />
                    </div>
                </div>
            </div>
        </section>
    );
}
