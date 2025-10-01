import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_EMAIL_URL;

const apiEmail = axios.create({
  baseURL: API_URL,
});

export default apiEmail;
