"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { LLMChatBox } from "./LLMChatBox";

function applyMovingAverage(data: any[], keys: string[], windowSize: number) {
    if (data.length < windowSize) return data;

    const smoothedData = data.map((d, i) => {
        const newPoint = { ...d };
        if (i < windowSize - 1) {
            // not enough data, return og point
            return newPoint;
        }

        // for each key, calculate the average of the last window size points
        for (const key of keys) {
            let sum = 0;
            for (let j = 0; j < windowSize; j++) {
                // handle nested keys, i.e. acc[0]
                const keysArr = key.replace(/\[(\d+)\]/, '.$1').split('.');
                let val = data[i - j];
                for (const k of keysArr) {
                    val = val ? val[k] : 0;
                }
                sum += val || 0;
            }
             // handle nested keys for assignment
            const keysArr = key.replace(/\[(\d+)\]/, '.$1').split('.');
            let current = newPoint;
            for (let k = 0; k < keysArr.length - 1; k++) {
                current[keysArr[k]] = { ...current[keysArr[k]] };
                current = current[keysArr[k]];
            }
            current[keysArr[keysArr.length - 1]] = sum / windowSize;
        }
        return newPoint;
    });

    return smoothedData;
}


// main component
export function SensorChart() {
    const [rawData, setRawData] = useState<any []>([]);
    
    const metricsToSmooth = ['temperature', 'humidity', 'moisture', 'pressure', 'acc[0]'];
    const smoothingWindow = 5;

    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await fetch("api/sensors");
            const newData = await res.json();
            setRawData((prev) => [...prev.slice(-55), newData]); 
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const smoothedData = useMemo(
        () => applyMovingAverage(rawData, metricsToSmooth, smoothingWindow),
        [rawData]
    );

    return (
        <div className="p-4 md:p-2">
            <h1 className="text-3xl font-bold mb-8">Sensor Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <TemperatureHumidityChart data={smoothedData} />
                <MoistureChart data={smoothedData} />
                <PressureChart data={smoothedData} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
                <AccelerationChart data={smoothedData} />
                <div className="md:col-span-2">
                    <LLMChatBox data={smoothedData.slice(-20)} />
                </div>
            </div>

        </div>
    );
}


function ChartWrapper({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <div style={{ width: '100%', height: 250 }}>
                {children}
            </div>
        </div>
    );
}

function TemperatureHumidityChart({ data }: { data: any[] }) {
    return (
        <ChartWrapper title="Temperature & Humidity">
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line name="Temperature" type="monotone" dataKey="temperature" stroke="#ff6384" dot={false} isAnimationActive={false} />
                    <Line name="Humidity" type="monotone" dataKey="humidity" stroke="#36a2eb" dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
}

function MoistureChart({ data }: { data: any[] }) {
    return (
        <ChartWrapper title="Moisture">
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="moisture" stroke="#4bc0c0" dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
}

function PressureChart({ data }: { data: any[] }) {
    return (
        <ChartWrapper title="Pressure">
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="pressure" stroke="#ff9f40" dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
}

function AccelerationChart({ data }: { data: any[] }) {
    return (
        <ChartWrapper title="Acceleration (X-Axis)">
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis />
                    <Tooltip />
                    <Line name="Acc X" type="monotone" dataKey="acc[0]" stroke="#9966ff" dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
}