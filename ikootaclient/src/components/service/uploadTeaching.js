import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "./api.js";

// Fetch teachings
export const useFechTeachings = () => {
  console.log("this is the get request")

  return useQuery({
    querykey:["teachings"],
    queryFn: async () => {
    const response = await api.get("/teachings");
    return response.data;
    }
  });
};

