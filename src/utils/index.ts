import { ChainId, CurrencyAmount, Percent, Token as SDKToken, TokenAmount } from "@sushiswap/sdk";
import { ethers } from "ethers";
import { ETH } from "../constants/tokens";
import getContract from "./getContract";
import { Token} from "@sushiswap/sdk";

// ToDo Rename to WBSC (Wrapped BSC)
export const WETH = {
    56: new Token(ChainId.BSC, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 18, 'WBNB', 'Wrapped BNB')
};

export const formatUSD = (value: number, maxFraction = 2) => {
    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFraction
    });
    return formatter.format(value);
};

export const formatPercentage = (value: number, maxFraction = 2) => {
    const formatted = String(value * 100);
    if (maxFraction > 0) {
        const split = formatted.split(".");
        if (split.length > 1) {
            return split[0] + "." + split[1].substr(0, maxFraction);
        }
    }
    return formatted;
};

export const formatBalance = (value: ethers.BigNumberish, decimals = 18, maxFraction = 8) => {
    const formatted = ethers.utils.formatUnits(value, decimals);
    if (maxFraction > 0) {
        const split = formatted.split(".");
        if (split.length > 1) {
            return split[0] + "." + split[1].substr(0, maxFraction);
        }
    }
    return formatted;
};

export const parseBalance = (value: string, decimals = 18) => {
    return ethers.utils.parseUnits(value || "0", decimals);
};

export const isEmptyValue = (text: string) =>
    ethers.BigNumber.isBigNumber(text)
        ? ethers.BigNumber.from(text).isZero()
        : text === "" || text.replace(/0/g, "").replace(/\./, "") === "";

export const isETH = (token?: Token) => token?.address.toLowerCase() === ETH.address.toLowerCase();

export const isWETH = (token?: Token) => token?.address.toLowerCase() === WETH[56].address.toLowerCase();

export const isETHWETHPair = (fromToken?: Token, toToken?: Token) => {
    return (isETH(fromToken) && isWETH(toToken)) || (isWETH(fromToken) && isETH(toToken));
};

export const convertToken = (token: Token) => {
    return token.symbol === "BNB" ? WETH[56] : new SDKToken(ChainId.BSC, token.address, token.decimals);
};

export const convertAmount = (token: Token, amount: string) => {
    return new TokenAmount(convertToken(token), parseBalance(amount, token.decimals).toString());
};

export const parseCurrencyAmount = (value: CurrencyAmount, decimals = 18) => {
    return ethers.BigNumber.from(parseBalance(value.toExact(), decimals));
};

export const deduct = (amount: ethers.BigNumber, percent: Percent) => {
    return amount.sub(amount.mul(percent.numerator.toString()).div(percent.denominator.toString()));
};

export const pow10 = (exp: ethers.BigNumberish) => {
    return ethers.BigNumber.from(10).pow(exp);
};

export const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US") + " " + date.toLocaleTimeString("en-US");
};

export { getContract };
