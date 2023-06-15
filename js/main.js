// Generic API call function
function callApi(url, method, data) {
  return axios({
    method: method,
    url: url,
    data: data,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
      throw error; // Rethrow the error to handle it at the caller level if needed
    });
}

const API_URL = "http://localhost:5000/api";
