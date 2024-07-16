import createRefresh from 'react-auth-kit/createRefresh';

const refresh = createRefresh({
    interval: 29*60,
    refreshApiCallback: async ({
        authToken,
        refreshToken,
    }) => {
        try {
            const response = await fetch('http://localhost:3001/v1/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ refreshToken })
            });
            const data = await response.json();
            if(!response.ok) {
                console.error(data.message);
                return {
                    isSuccess: false
                } 
            }
            return {
                isSuccess: true,
                newAuthToken: data.accessToken,
                newAuthTokenExpireIn: 30*60,
                newRefreshToken: data.refreshToken,
                newRefreshTokenExpiresIn: 30*24*60*60
            }
        }
        catch(error){
            console.error(error)
            return {
                isSuccess: false
            } 
        }
    }
});

export default refresh;
