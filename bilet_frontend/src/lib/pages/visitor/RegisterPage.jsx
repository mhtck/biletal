import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { clearError, registerUser } from "@/lib/redux/authSlice";

const FormSchema = z.object({
  first_name: z.string().min(3, {
    message: "Adınızı giriniz",
  }),
  last_name: z.string().min(3, {
    message: "Soyadınızı giriniz",
  }),
  email: z.string().email({
    message: "Email formatı doğru değil",
  }),
  password: z.string().min(8, {
    message: "Şifre en az 8 karakter olmalı",
  }),
  password2: z.string().min(8, {
    message: "Şifre en az 8 karakter olmalı",
  }),
});

function RegisterPage() {
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      password2: "",
    },
  });

  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const [errors, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("isAuthantic:", isAuthenticated)
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (data) => {
    setError("");

    console.log("Form verisi:", data);

    try {
      const result = await dispatch(registerUser(data)).unwrap();
      console.log("response : ", result)
      if (result.email == data.email) {
        toast.success("Kayıt işlemi başarılı");
        toast("Oturum açınız");
        navigate("/login");
      } else {
        setError(result.error);
        toast.error("Kayıt yapılamadı");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className=" min-h-screen flex items-center justify-center py-12 px-4 space-x-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-gray-100 rounded-2xl p-4 space-y-8">
        <h2 className="text-center text-3xl font-extrabold">Kayıt Ol</h2>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="w-full space-y-6"
          >
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İsim</FormLabel>
                  <FormControl>
                    <Input placeholder="İsim" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soyad</FormLabel>
                  <FormControl>
                    <Input placeholder="Soyad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre</FormLabel>
                  <FormControl>
                    <Input placeholder="Password" {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre Tekrar</FormLabel>
                  <FormControl>
                    <Input placeholder="Şifre" {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} variant="mybutton" size="">
              {loading ? "Kayıt yapılıyor..." : "Kayıt Yap"}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-gray-600 hover:text-blue-700">
                Zaten Hesabınız varmı? Giriş yapın.
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default RegisterPage;
