import useSWR from "swr";

export const fetcher = (url: string) => fetch(url).then(res => res.json());
