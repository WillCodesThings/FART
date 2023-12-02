const fetcher = async (query: any, headers: any, url: string, fetch) => {
    try {
        const res = await fetch(url + `/api/${query}/`, {method: "GET", headers : headers});
        const data = await res.json();
        return data;
    } catch (error){
        console.log(error);
        return error;
    }
}

export default fetcher