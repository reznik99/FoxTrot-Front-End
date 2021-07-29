
import '../../global/variables';


export function validateToken() {
    try {
        return async (dispatch) => {
            const res = await axios.get(`${API_URL}/validateToken`);
            if (res.data?.valid) {
                dispatch({
                    type: "TOKEN_VALID",
                    payload: true,
                });
            } else {
                dispatch({
                    type: "TOKEN_INVALID",
                    payload: false,
                });
            }
        };
    } catch (err) {
        console.error(err)
    }
}

export function getSomeData() {
    try {
        return async (dispatch) => {
            const res = await axios.get(`${API_URL}/something`);
            if (res.data) {
                dispatch({
                    type: "GET_SOMETHING",
                    payload: res.data,
                });
            } else {
                console.log('Unable to fetch');
            }
        };
    } catch (error) {
        // Add custom logic to handle errors
    }
}