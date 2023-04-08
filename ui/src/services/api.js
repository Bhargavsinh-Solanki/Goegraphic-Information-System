import axios from "axios";

class BaseService {
	constructor() {
		axios.interceptors.request.use(
			async function (config) {
				return config;
			},
			function (error) {
				return Promise.reject(error);
			}
		);

		axios.interceptors.response.use(
			function (response) {
				// console.log(response.data)
				if (response.data.errorText && response.data.errorText != "") {
					response.status = 500;
					return Promise.reject(response.data);
				} else {
					return response;
				}
			},
			async function (error) {
				console.log(error.response);
				if (error.response.data) {
					if (error.response.status === 401) {
					}
				}
				return Promise.reject(error.response.data);
			}
		);
	}

	getData(targeturl, path) {
		let url = `${targeturl}${path}`;
		return axios.get(`${url}`);
	}

	postData(targeturl, path, data) {
		let url = `${targeturl}${path}`;
		return axios.post(`${url}`, data);
	}

	putData(targeturl, path, data) {
		let url = `${targeturl}${path}`;
		return axios.put(`${url}`, data);
	}

	deleteData(targeturl, path) {
		let url = `${targeturl}${path}`;
		return axios.delete(`${url}`);
	}
}

export default new BaseService();
