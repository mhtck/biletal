"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";

import { CalendarIcon } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils/twMerge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setFindTrip } from "@/lib/redux/tripSlice";

const FormSchema = z.object({
  origin: z.string({ required_error: "Nereden seçilmeli" }),
  destination: z.string({ required_error: "Nereye seçilmeli" }),
  date: z.date({ required_error: "Tarih gerekli" }),
});

export function TripSearchForm({ vehicleType }) {
  const dispatch = useDispatch();

  const vehicle = { bus: "Otobüs", plain: "Uçak", train: "Tren" };
  const findTrip = useSelector((state) => state.trip.findTrip);

  const iller = ["Adana", "Diyarbakır", "Isparta", "Mersin", "İstanbul"];

  const form = useForm({
    resolver: zodResolver(FormSchema),
  });

  const navigate = useNavigate();

  const onSubmit = (data) => {
    try {
      data.date = data.date.toISOString();
      data.vehicle_type = vehicleType;
      dispatch(setFindTrip(data));
      console.log("findtrip : ", data);
      navigate("/trip");
    } catch (error) {
      // Error handling is done in the useEffect above
      console.error("error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
        <div className="flex justify-center items-center space-y-6 space-x-6">
          {/* Nereden */}
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nereden</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {iller.map((il, index) => (
                      <SelectItem value={il} key={index}>
                        {il}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nereye */}
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nereye</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {iller.map((il, index) => (
                      <SelectItem value={il} key={index}>
                        {il}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tarih */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tarih</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? format(field.value, "PPP", { locale: tr })
                          : "Tarih seçin"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      locale={tr}
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      captionLayout="buttons"
                      disabled={(date) => date < startOfDay(new Date())}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" variant="outline">
            <span className="text-red-600">{vehicle[vehicleType]}</span>
            bilet bul
          </Button>
        </div>
      </form>
    </Form>
  );
}
