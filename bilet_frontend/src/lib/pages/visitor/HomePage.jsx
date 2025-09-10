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
import { TripSearchForm } from "./TripSearch";

const HomePage = () => {
  const [nereden, setNereden] = useState("");
  const [nereye, setNereye] = useState("");

  const [vehicleType, setVehicleType] = useState("bus");

  useEffect(() => {
    console.log("vehicle ", vehicleType);
  }, [vehicleType]);

  return (
    <div className=" bg-fixed flex items-center border shadow rounded-lg p-6 space-x-3 mt-44 ">
      <TripSearchForm vehicleType={vehicleType} />
    </div>
  );
};

export default HomePage;
