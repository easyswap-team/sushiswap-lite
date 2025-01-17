import React, { FC, useCallback, useContext, useState, useEffect } from "react";
import { Platform, View } from "react-native";

import useAsyncEffect from "use-async-effect";
import AmountMeta from "../components/AmountMeta";
import Border from "../components/Border";
import Button from "../components/Button";
import ChangeNetwork from "../components/ChangeNetwork";
import CloseIcon from "../components/CloseIcon";
import Container from "../components/Container";
import Content from "../components/Content";
import ErrorMessage from "../components/ErrorMessage";
import FetchingButton from "../components/FetchingButton";
import FlexView from "../components/FlexView";
import Heading from "../components/Heading";
import InfoBox from "../components/InfoBox";
import { ITEM_SEPARATOR_HEIGHT } from "../components/ItemSeparator";
import LPTokenSelect, { LPTokenItemProps } from "../components/LPTokenSelect";
import Meta from "../components/Meta";
import Selectable from "../components/Selectable";
import SelectIcon from "../components/SelectIcon";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenInput from "../components/TokenInput";
import TokenLogo from "../components/TokenLogo";
import WebFooter from "../components/web/WebFooter";
import { FarmingSubMenu } from "../components/web/WebSubMenu";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import useFarmingState, { FarmingState } from "../hooks/useFarmingState";
import useColors from "../hooks/useColors";
import useTranslation from "../hooks/useTranslation";
import useHelper from "../hooks/useHelper";
import MetamaskError from "../types/MetamaskError";
import Token from "../types/Token";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import Screen from "./Screen";

const HarvestScreen = () => {
    const t = useTranslation();
    const [scrollTop, setScrollTop] = useState(100)

    return (
        <Screen>
            {IS_DESKTOP && <FarmingSubMenu scrollTop={scrollTop} />}
            <Container>
                {!IS_DESKTOP && <FarmingSubMenu scrollTop={scrollTop} />}
                <Content style={{marginTop: 90}}>
                    <Title text={t("harvest-sushi")} />
                    <Text light={true}>{t("harvest-sushi-desc")}</Text>
                    <Harvest />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
        </Screen>
    );
};

const Harvest = () => {
    const [tokenChanged, setTokenChanged] = useState(false)
    const {pathTokenAdress} = useHelper()
    const state = useFarmingState(true);
    const t = useTranslation();
    const { chainId } = useContext(EthersContext);

    useEffect(() => {
        if(state.lpTokens) {
            const opendToken = state.lpTokens.find(token => token.address === pathTokenAdress)

            if(opendToken && !tokenChanged) {
                state.setSelectedLPToken(opendToken)
            }
        }
    }, [state, pathTokenAdress])
    
    if (chainId !== 56) return <ChangeNetwork />;

    return (
        <View style={{ marginTop: 25 }}>
            <LPTokenSelect
                state={state}
                title={"My Farms"}
                emptyText={t("you-dont-have-lp-tokens-deposited")}
                setTokenChanged={setTokenChanged}setTokenChanged={setTokenChanged}
                Item={TokenItem}
            />
            <Border />
            <Withdraw state={state} />
            <WithdrawInfo state={state} />
        </View>
    );
};

// tslint:disable-next-line:max-func-body-length
const TokenItem: FC<LPTokenItemProps> = props => {
    const amount = formatBalance(props.token?.amountDeposited || 0, props.token.decimals, 8);
    const onPress = useCallback(() => {
        if(props.setTokenChanged) {
            props.setTokenChanged(true)
        }
        props.onSelectToken(props.token);
    }, [props.onSelectToken, props.token]);
    const { textLight, tokenBg } = useColors();

    const getSymbols = () => {
        let symbols = ''

        if(props.token.tokenA && props.token.tokenB) {
            symbols = `${props.token.tokenA.symbol}-${props.token.tokenB.symbol}`
        }
        else if(props.token.symbol) {
            symbols = props.token.symbol
        }
        
        return symbols
    }

    const getLogos = () => {
        if(props.token.tokenA && props.token.tokenB) {
            return (
                <>
                    <TokenLogo token={props.token.tokenA} small={true} replaceWETH={true} />
                    <TokenLogo token={props.token.tokenB} small={true} replaceWETH={true} style={{ position: 'absolute', top: 15, left: 15 }} />
                </>
            )
        }
        else if(props.token.symbol) {
            return <TokenLogo token={props.token} small={true} replaceWETH={true} style={{ top: 5, left: 10 }} />
        }
    }

    return (
        <Selectable
            selected={props.selected}
            onPress={onPress}
            containerStyle={{ marginBottom: ITEM_SEPARATOR_HEIGHT }}>
            <FlexView style={{
                    alignItems: "center",
                    paddingBottom: 20,
                    paddingTop: 20,
                    paddingLeft: 10,
                    paddingRight: 10,
                    background: tokenBg,
                    borderRadius: 8
                }}
            >
                <View style={{alignSelf: 'flex-start'}}>
                    {getLogos()}
                </View>
                <View style={{flexDirection: 'column', marginLeft: Spacing.normal}}>
                    {props.token.type && <Text style={{fontSize: 12, color: textLight, paddingBottom: 5}}>{props.token.type}</Text>}
                    <Text medium={true} caption={true}>
                        {getSymbols()}
                    </Text>
                </View>
                <Text caption={IS_DESKTOP} medium={true} style={{ flex: 1, textAlign: "right", marginRight: 4 }}>
                    {amount}
                </Text>
                {props.selected ? <CloseIcon /> : <SelectIcon />}
            </FlexView>
        </Selectable>
    );
};

const Withdraw = ({ state }: { state: FarmingState }) => {
    const t = useTranslation();
    if (!state.selectedLPToken) {
        return null
    }
    // This enables MAX button
    const token = {
        ...state.selectedLPToken,
        balance: state.selectedLPToken.amountDeposited
    } as Token;
    return (
        <View>
            <Heading text={state.selectedLPToken.symbol + " " + t("amount")} />
            <TokenInput token={token} amount={state.amount} onAmountChanged={state.setAmount} autoFocus={IS_DESKTOP} />
        </View>
    );
};

const WithdrawInfo = ({ state }: { state: FarmingState }) => {
    const t = useTranslation();
    const amount = parseBalance(state.amount);
    const total = state.selectedLPToken?.amountDeposited;
    const sushi = total && amount.lte(total) ? state.selectedLPToken!.pendingEsm : null;
    const sushiEsg = total && amount.lte(total) ? state.selectedLPToken!.pendingEsg : null;
    const disabled = !state.pair && !state.selectedLPToken;

    if(disabled) {
        return null
    }

    return (
        <InfoBox>
            {
                sushi?.toString() !== '0' &&
                    <AmountMeta
                        amount={sushi ? formatBalance(sushi) : ""}
                        suffix={"ESM"}
                    />
            }
            {
                sushiEsg?.toString() !== '0' &&
                    <AmountMeta
                        amount={sushiEsg ? formatBalance(sushiEsg) : ""}
                        suffix={"ESG"}
                    />
            }
            <Meta label={t("deposited-lp-token")} text={total ? formatBalance(total) : ""} disabled={disabled} />
            <WithdrawControls state={state} />
        </InfoBox>
    );
};

const WithdrawControls = ({ state }: { state: FarmingState }) => {
    const t = useTranslation();
    const [error, setError] = useState<MetamaskError>({});
    useAsyncEffect(() => setError({}), [state.selectedLPToken]);
    const disabled = isEmptyValue(state.amount);
    return (
        <View style={{ marginTop: Spacing.normal }}>
            {!state.selectedLPToken || state.selectedLPToken.amountDeposited?.isZero() ? (
                <WithdrawButton state={state} onError={setError} disabled={true} />
            ) : parseBalance(state.amount, state.selectedLPToken!.decimals).gt(
                  state.selectedLPToken!.amountDeposited!
              ) ? (
                <Button title={t("insufficient-amount")} disabled={true} />
            ) : state.loading ? (
                <FetchingButton />
            ) : (
                <WithdrawButton state={state} onError={setError} disabled={disabled} />
            )}
            {error.message && error.code !== 4001 && <ErrorMessage error={error} />}
        </View>
    );
};

const WithdrawButton = ({
    state,
    onError,
    disabled
}: {
    state: FarmingState;
    onError: (e) => void;
    disabled: boolean;
}) => {
    const t = useTranslation();
    const onPress = useCallback(() => {
        onError({});
        state.onWithdraw().catch(onError);
    }, [state.onWithdraw, onError]);
    return <Button title={t("withdraw")} disabled={disabled} loading={state.withdrawing} onPress={onPress} />;
};

export default HarvestScreen;
