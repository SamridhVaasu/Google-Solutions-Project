"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MainPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Cargo Management System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Manage your vehicles, cargo, and routes efficiently with our system.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            onClick={() => router.push("/transport/road")}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            Road Transport
          </Button>
          <Button
            size="lg"
            onClick={() => router.push("/transport/air")}
            className="bg-green-500 text-white hover:bg-green-600"
          >
            Air Transport
          </Button>
          <Button
            size="lg"
            onClick={() => router.push("/transport/waterway")}
            className="bg-purple-500 text-white hover:bg-purple-600"
          >
            Waterway Transport
          </Button>
        </div>
      </motion.div>
    </div>
  );
}