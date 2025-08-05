export async function GET() {
    const data = {
        timestamp: Date.now(),
        temperature: 20 + Math.random() * 5,
        humidity: 40 + Math.random() * 10,
        pressure: 1010 + Math.random() * 3,
        moisture: 300 + Math.random() * 50,
        acc: [
            0.1 + Math.random() * 0.1,
            -0.05 + Math.random() * 0.1,
            9.7 + Math.random() * 0.2
        ],
        gyro: [
            0.01 + Math.random() * 0.01,
            0.01 + Math.random() * 0.1,
            0.01 + Math.random() * 0.1,
        ]
    };
    return Response.json(data);
}