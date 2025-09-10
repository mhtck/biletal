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
import { clearError, loginUser } from "@/lib/redux/authSlice";
import toast from "react-hot-toast";

const FormSchema = z.object({
  email: z.string().email({
    message: "Email formatı doğru değil.",
  }),
  password: z.string().min(8, {
    message: "Şifre en az 8 karakter olmalı",
  }),
});

function LoginPage() {
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [errors, setError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated) {
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

    const email = data.email; // input name="username" olduğu için

    console.log("Login verisi:", { data });

    try {
      const result = await dispatch(loginUser(data)).unwrap();
      console.log("result:", result)
      if (result.status == 200) {
        toast.success("Hoşgeldiniz");
        navigate("/");
      }
    } catch (error) {
      // Error handling is done in the useEffect above
      console.error("Login error:", error);
    }
  };

  return (
    <div className=" min-h-screen flex items-center justify-center py-12 px-4 space-x-4 sm:px-6 lg:px-8">
      {/* <img className='object-cover rounded-2xl' src='trips.jpeg'/> */}

      <div className="max-w-xl w-full bg-gray-100 rounded-2xl p-4 space-y-8">
        <h2 className="text-center text-3xl font-extrabold">Giriş Yap</h2>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="w-full space-y-6"
          >
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
            <Button type="submit" disabled={loading} variant="mybutton" size="">
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
            <div className="text-center">
              <Link
                to="/register"
                className="text-gray-600 hover:text-blue-700"
              >
                Hesabınız yok mu? Kayıt olun
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default LoginPage;
