import React, { FC, useCallback, useContext, useMemo } from "react";
import { FlatList, Platform, TouchableHighlight, View } from "react-native";
import { Icon } from "react-native-elements";

import { ethers } from "ethers";
import Border from "../components/Border";
import Container from "../components/Container";
import Content from "../components/Content";
import FlexView from "../components/FlexView";
import Heading from "../components/Heading";
import Loading from "../components/Loading";
import Text from "../components/Text";
import Title from "../components/Title";
import TokenAmount from "../components/TokenAmount";
import TokenLogo from "../components/TokenLogo";
import TokenName from "../components/TokenName";
import TokenPrice from "../components/TokenPrice";
import TokenSymbol from "../components/TokenSymbol";
import TokenValue from "../components/TokenValue";
import WebFooter from "../components/web/WebFooter";
import { IS_DESKTOP, Spacing } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import useHomeState, { HomeState } from "../hooks/useHomeState";
import useLinker from "../hooks/useLinker";
import useTranslation from "../hooks/useTranslation";
import useStyles from "../hooks/useStyles";
import LPTokenWithValue from "../types/LPTokenWithValue";
import TokenWithValue from "../types/TokenWithValue";
import { formatUSD } from "../utils";
import Screen from "./Screen";
import { PortfolioIcon, PortfolioDarkIcon, ExternalIcon } from '../components/svg/Icons'

interface TokenItemProps {
    token: TokenWithValue;
    disabled?: boolean;
}

interface LPTokenItemProps {
    token: LPTokenWithValue;
    disabled?: boolean;
}

const HomeScreen = ({navigation}) => {
    const t = useTranslation();
    const state = useHomeState();
    const { borderDark } = useColors();
    const { borderBottom } = useStyles();
    const { loadingTokens } = useContext(EthersContext);
    const { darkMode } = useContext(GlobalContext);
    const loading = loadingTokens || state.loadingLPTokens || state.loadingPools;
    const totalValue = sum(state.tokens) + sum(state.lpTokens) + sum(state.pools);

    return (
        <Screen>
            <Container>
                <Content style={{ paddingBottom: Spacing.huge }}>
                    <Title text={t("total-value")} style={{ flex: 1, paddingBottom: 15 }} />
                    <View style={{flexDirection: 'row', alignItems: 'center', paddingBottom: 15, ...borderBottom()}}>
                        {darkMode ? <PortfolioDarkIcon /> : <PortfolioIcon />}
                        <Title
                            text={loading ? t("fetching") : formatUSD(totalValue, 4)}
                            fontWeight={"light"}
                            disabled={loading}
                            style={{ fontSize: IS_DESKTOP ? 25 : 24, marginBottom: 0, marginLeft: 15 }}
                        />
                    </View>
                    <Home state={state} />
                </Content>
                {Platform.OS === "web" && <WebFooter />}
            </Container>
        </Screen>
    );
};

const Home = ({ state }: { state: HomeState }) => {
    const { borderBottom } = useStyles();

    return (
        <View style={{ marginTop: IS_DESKTOP ? Spacing.large : Spacing.normal }}>
            <MyTokens state={state} />
            <View style={{ height: Spacing.normal, ...borderBottom() }} />
            <MyLPTokens state={state} />
            <View style={{ height: Spacing.large }} />
            <Pools state={state} />
        </View>
    );
};

const MyTokens = ({ state }: { state: HomeState }) => {
    const t = useTranslation();
    const { loadingTokens, tokens } = useContext(EthersContext);
    const goToSwap = useLinker("/swap", "Swap");
    return (
        <View>
            <Heading text={t("tokens")} buttonText={t("manage")} onPressButton={goToSwap} />
            <TokenList loading={loadingTokens} tokens={tokens} TokenItem={TokenItem} />
        </View>
    );
};

const MyLPTokens = ({ state }: { state: HomeState }) => {
    const t = useTranslation();
    const goToRemoveLiquidity = useLinker("/liquidity/remove", "RemoveLiquidity");
    return (
        <View style={{marginTop: 20}}>
            <Heading text={t("liquidity")} buttonText={t("manage")} onPressButton={goToRemoveLiquidity} />
            {/* @ts-ignore */}
            <TokenList loading={state.loadingLPTokens} tokens={state.lpTokens} TokenItem={LPTokenItem} />
        </View>
    );
};

const Pools = ({ state }: { state: HomeState }) => {
    const t = useTranslation();
    const goToFarming = useLinker("/farming", "Farming");
    return (
        <View>
            <Heading text={t("farms")} buttonText={t("manage")} onPressButton={goToFarming} />
            {/* @ts-ignore */}
            <TokenList loading={state.loadingPools} tokens={state.pools} TokenItem={LPTokenItem} />
        </View>
    );
};

const TokenList = (props: {
    loading: boolean;
    tokens?: TokenWithValue[] | LPTokenWithValue[];
    TokenItem: FC<TokenItemProps | LPTokenItemProps>;
}) => {
    const renderItem = useCallback(({ item }) => {
        return <props.TokenItem key={item.address} token={item} />;
    }, []);
    const data = useMemo(
        () =>
            (props.tokens || [])
                // @ts-ignore
                .filter(token => !(token.amountDeposited ? token.amountDeposited.isZero() : token.balance.isZero()))
                .sort((t1, t2) => (t2.valueUSD || 0) - (t1.valueUSD || 0)),
        [props.tokens]
    );
    return props.loading ? (
        <Loading />
    ) : data.length === 0 ? (
        <EmptyList />
    ) : (
        <FlatList
            keyExtractor={item => item.address}
            data={data}
            renderItem={renderItem}
        />
    );
};

const EmptyList = () => {
    const t = useTranslation();
    const { border } = useStyles()
    return (
        <View style={{ width: '100%', paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, ...border() }}>
            <Text style={{ textAlign: "center", width: "100%" }}>
                {t("you-dont-have-assets")}
            </Text>
        </View>
    );
};

const TokenItem = (props: TokenItemProps) => {
    const { tokenBg } = useColors();
    return (
        <FlexView style={{ alignItems: "center", marginBottom: 5, paddingBottom: 20, paddingTop: 20, paddingLeft: 10, paddingRight: 10, background: tokenBg, borderRadius: 8 }}>
            <TokenLogo token={props.token} disabled={props.disabled} />
            <View>
                <TokenPrice token={props.token} disabled={props.disabled} style={{ marginLeft: Spacing.small, paddingBottom: 5 }} />
                <TokenName token={props.token} disabled={props.disabled} />
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
                <TokenValue token={props.token} disabled={props.disabled} style={{paddingBottom: 5}} />
                <FlexView>
                    <TokenAmount token={props.token} disabled={props.disabled} />
                    {IS_DESKTOP && <TokenSymbol token={props.token} disabled={props.disabled} />}
                </FlexView>
            </View>
            <ExternalBtn path={"/tokens/" + props.token.address} />
        </FlexView>
    );
};

const LPTokenItem = (props: LPTokenItemProps) => {
    const { textLight, tokenBg } = useColors();

    return (
        <FlexView style={{
            background: tokenBg,
            alignItems: "center",
            marginBottom: 5,
            paddingTop: '20px',
            paddingRight: '10px',
            paddingBottom: '20px',
            paddingLeft: '10px',
            borderRadius: 8
            }}
        >
            <View style={{alignSelf: 'flex-start'}}>
                <TokenLogo token={props.token.tokenA} small={true} replaceWETH={true} />
                <TokenLogo token={props.token.tokenB} small={true} replaceWETH={true} style={{ position: 'absolute', top: 15, left: 15 }} />
            </View>
            <View style={{ marginLeft: Spacing.normal }}>
                <Text style={{color: textLight, paddingBottom: 5}}>Liquidity pair</Text>
                <Text medium={true} caption={true}>
                    {props.token.tokenA.symbol}-{props.token.tokenB.symbol}
                </Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
                <TokenValue token={props.token} disabled={props.disabled} />
                <FlexView style={{paddingTop: 5}}>
                    <TokenAmount token={props.token} amount={props.token.amountDeposited} disabled={props.disabled} />
                </FlexView>
            </View>
            <ExternalBtn path={"/pairs/" + props.token.address} />
        </FlexView>
    );
};

const ExternalBtn = ({ path }) => {
    const { textDark, disabled } = useColors();
    const isETH = path.endsWith(ethers.constants.AddressZero);
    return (
        <TouchableHighlight disabled={isETH}>
            <ExternalIcon style={{ marginLeft: Spacing.small }} />
        </TouchableHighlight>
    );
};

const sum = tokens => (tokens ? tokens.reduce((previous, current) => previous + (current.valueUSD || 0), 0) : 0);

export default HomeScreen;
