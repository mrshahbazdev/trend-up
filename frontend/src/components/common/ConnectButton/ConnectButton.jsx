import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import ButtonBorder from "../ButtonBorder";
import { useRef } from "react";

const ConnectButton = () => {
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const isConnecting = useRef(false);

    const handleConnect = () => {
        // Prevent multiple simultaneous connection attempts
        if (isConnecting.current) {
            return;
        }

        try {
            isConnecting.current = true;
            open(); // Don't await - it just opens a modal
            
            // Reset after a delay
            setTimeout(() => {
                isConnecting.current = false;
            }, 1000);
        } catch (error) {
            isConnecting.current = false;
        }
    };

    return (
        <ButtonBorder
            className="hvr-bounce-to-right-sign"
            sx={{ textTransform: "capitalize", fontSize: "14px" }}
            onClick={handleConnect}
        >
            {isConnected && address 
                ? `${address.slice(0, 6)}...${address.slice(-4)}` 
                : 'connect'}
        </ButtonBorder>
    );
};

export default ConnectButton;
