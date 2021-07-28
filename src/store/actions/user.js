
import '../../global/variables';

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