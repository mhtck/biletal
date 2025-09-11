import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar01 } from "@/components/ui/navbar";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@radix-ui/react-label";
import { ArrowRightLeft } from "lucide-react";

function LayoutComponent({ children }) {
  const [nereden, setNereden] = useState("");
  const [nereye, setNereye] = useState("");

  const [vehicleType, setVehicleType] = useState("bus");

  useEffect(() => {
    console.log("vehicle ", vehicleType);
  }, [vehicleType]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar01 setVehicleType={setVehicleType} />

      <main className="max-w-7xl mx-auto items-center py-2 px-4">
        {typeof children === "function" ? children({ vehicleType }) : children}
      </main>
    </div>
  );
}

export default LayoutComponent;
