import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import useTranslation from "../hooks/useTranslation";
import Text from "./Text";

const ChangeNetwork = ({ chainId = 56 }) => {
    const t = useTranslation();
    const networkName = {
        56: "Binance Smart Chain(BSC)"
    }[chainId];
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text light={true} style={{ textAlign: "center", marginVertical: Spacing.large }}>
                {t("change-network-to", { networkName })}
            </Text>
        </View>
    );
};

export default ChangeNetwork;
