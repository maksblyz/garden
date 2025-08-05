import { useState, useRef, useEffect } from "react";

export function LLMChatBox({ data }: { data: any[] }) {
    const [input, setInput] = useState("");
    const [responses, setResponses] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentResponse, setCurrentResponse] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const askLLM = async () => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        setCurrentResponse("");
        
        try {
            const res = await fetch("/api/llm", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ input, data }),
            });

            if (!res.ok) {
                throw new Error('Failed to get response');
            }

            const reader = res.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            let fullResponse = "";
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                fullResponse += chunk;
                setCurrentResponse(fullResponse);
            }

            setResponses(prev => [...prev, `Q: ${input}`, `A: ${fullResponse}`]);
            setInput("");
        } catch (error) {
            console.error('Error:', error);
            setCurrentResponse("Error: Failed to get response");
        } finally {
            setIsLoading(false);
            setCurrentResponse("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askLLM();
        }
    };

    // Auto scroll to bottom when responses change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [responses, currentResponse]);

    return (
        <div className="h-[280px] flex flex-col border rounded-2xl shadow relative">
            {/* Response area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-20">
                {responses.length > 0 && (
                    <div className="space-y-2">
                        {responses.map((response, index) => (
                            <p key={index} className="text-sm whitespace-pre-wrap">
                                {response}
                            </p>
                        ))}
                    </div>
                )}
                {/* Show streaming response */}
                {currentResponse && (
                    <p className="text-sm whitespace-pre-wrap">
                        A: {currentResponse}
                    </p>
                )}
            </div>
            
            {/* Input area */}
            <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white border rounded-full shadow-lg p-2 flex items-center gap-2">
                    <input
                        className="flex-1 px-3 py-2 bg-transparent outline-none"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask about your sensor data..."
                        disabled={isLoading}
                    />
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                        onClick={askLLM}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Thinking...' : 'Ask'}
                    </button>
                </div>
            </div>
        </div>
    );
}