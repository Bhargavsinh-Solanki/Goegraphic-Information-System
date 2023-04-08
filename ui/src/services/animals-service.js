import BaseService from "./api";
let API_URL = "http://localhost:5000";
export const getAnimals = (limit = 50) => {
	return new Promise(async (resolve, reject) => {
		BaseService.getData(API_URL, `/getAnimals/` + limit)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};
export const getRDP = (study) => {
	return new Promise(async (resolve, reject) => {
		BaseService.getData(API_URL, `/getRDP/` + study)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};
export const getAnimalsLifeTimeSimplifiedPaths = (study) => {
	return new Promise(async (resolve, reject) => {
		BaseService.postData(API_URL, `/getAnimalsLifeTimeSimplifiedPaths`, study)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

export const postRDP = (data) => {
	return new Promise(async (resolve, reject) => {
		BaseService.postData(API_URL, `/getRDP`, data)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

export const getAnimalsWithFirstLocation = (study) => {
	return new Promise(async (resolve, reject) => {
		BaseService.postData(API_URL, `/getAnimalsWithFirstLocation`, study)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

export const getAnimalsWithLastLocation = (study) => {
	return new Promise(async (resolve, reject) => {
		BaseService.postData(API_URL, `/getAnimalsWithLastLocation`, study)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

export const getStudyNames = () => {
	return new Promise(async (resolve, reject) => {
		BaseService.getData(API_URL, `/getStudyNames`)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

export const listOrders = (query) => {
	return new Promise(async (resolve, reject) => {
		BaseService.getData(API_URL, `/orders?${query}`)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

export const postOrder = (data) => {
	return new Promise(async (resolve, reject) => {
		BaseService.postData(API_URL, `/orders`, data)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

export const cancelOrder = (id) => {
	return new Promise(async (resolve, reject) => {
		BaseService.getData(API_URL, `/orders/removeOrder/${id}`)
			.then((res) => {
				resolve(res.data);
			})
			.catch((err) => {
				reject(err);
			});
	});
};
