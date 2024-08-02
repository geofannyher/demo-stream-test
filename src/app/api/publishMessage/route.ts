import { NextApiResponse } from "next";
import amqp from "amqplib";
import { NextResponse } from "next/server";

const RABBITMQ_URL = process.env.NEXT_RABBITMQ_URL;
export async function POST(req: Request, res: NextApiResponse) {
  if (req.method === "POST") {
    const { message } = await req.json();
    if (typeof message !== "string" || message.trim() === "") {
      return NextResponse.json({ success: false, message: "Invalid message" });
    }

    try {
      if (!RABBITMQ_URL) {
        return NextResponse.json({
          success: false,
          message: "RabbitMQ URL not found",
        });
      }

      console.log("Connecting to RabbitMQ...");
      const connection = await amqp.connect(RABBITMQ_URL);
      console.log("Connected to RabbitMQ");

      const channel = await connection.createChannel();
      console.log("Channel created");

      await channel.assertQueue("videotest1", { durable: false });
      console.log("Queue asserted");

      channel.sendToQueue("videotest1", Buffer.from(message));
      console.log("Message sent to queue");

      await channel.close();
      console.log("Channel closed");

      await connection.close();
      console.log("Connection closed");

      return NextResponse.json({ success: true, message: "Message published" });
    } catch (error) {
      console.error("Error publishing message:", error);
      return NextResponse.json({
        success: false,
        message: "Error publishing message",
      });
    }
  } else {
    return NextResponse.json({ success: false, message: "Method not allowed" });
  }
}
