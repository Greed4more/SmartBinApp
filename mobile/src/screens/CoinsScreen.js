import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../utils/supabase';
import { useApp } from '../context/AppContext';

const C = { bg:'#1A1A18', yellow:'#E8C547', orange:'#C4622D', white:'#F5F0E8', gray:'#2A2A28', card:'#252523', lightGray:'#888884', green:'#4A7C4E', blue:'#3A5A8C' };

const REWARDS = [
  {id:'r1',name:'Amazon ₹50 Off',cost:100,description:'₹50 off on any Amazon order above ₹500',icon:'🛒',color:'#FF9900'},
  {id:'r2',name:'Swiggy 10% Off',cost:150,description:'10% discount on your next Swiggy order',icon:'🍔',color:'#FC8019'},
  {id:'r3',name:'Tree Planted',cost:200,description:'We plant a tree in your name across India',icon:'🌳',color:C.green},
  {id:'r4',name:'Flipkart ₹100 Off',cost:250,description:'₹100 off on electronics on Flipkart',icon:'📱',color:'#2874F0'},
  {id:'r5',name:'IRCTC ₹75 Off',cost:175,description:'₹75 off on train ticket booking',icon:'🚆',color:'#1B5E20'},
  {id:'r6',name:'Donate to NGO',cost:500,description:'Donate equivalent to waste cleanup NGO',icon:'❤️',color:'#E74C3C'},
];

export default function CoinsScreen() {
  const { t, user, ecoCoins, redeemEcoCoins, userProfile } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    fetchTransactions();
    const sub = supabase.channel('txns-' + user.uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.uid}` }, fetchTransactions)
      .subscribe();
    return () => sub.unsubscribe();
  }, [user?.uid]);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.uid).order('created_at', { ascending: false });
    if (data) setTransactions(data);
    setLoadingTxns(false);
  };

  const handleRedeem = (reward) => {
    if (ecoCoins < reward.cost) { Alert.alert(t('insufficientCoins'), `You need ${reward.cost - ecoCoins} more EcoCoins.`); return; }
    Alert.alert('🎁 Redeem Reward', `Redeem "${reward.name}" for ${reward.cost} EcoCoins?`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('confirm'), onPress: async () => { try { await redeemEcoCoins(reward.cost, reward.name); Alert.alert('🎉', t('redeemSuccess')); } catch (err) { Alert.alert(t('error'), err.message); } } },
    ]);
  };

  const formatTime = (ts) => { if (!ts) return ''; const d = new Date(ts); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  const totalEarned = userProfile?.total_eco_coins_earned || 0;
  const totalRedeemed = Math.max(0, totalEarned - ecoCoins);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#2A2800', C.bg]} style={s.header}>
          <Text style={s.headerTitle}>{t('yourCoins')}</Text>
          <Text style={s.coinsDisplay}>{ecoCoins}</Text>
          <Text style={s.coinsSubtitle}>ECOCOINS</Text>
          <View style={s.statsRow}>
            {[{v:totalEarned,l:t('totalEarned'),c:C.white},{v:totalRedeemed,l:t('redeemed'),c:C.white},{v:ecoCoins,l:t('available'),c:C.yellow}].map((st,i)=>(
              <React.Fragment key={i}>{i>0&&<View style={s.statDivider}/>}<View style={s.statItem}><Text style={[s.statValue,{color:st.c}]}>{st.v}</Text><Text style={s.statLabel}>{st.l}</Text></View></React.Fragment>
            ))}
          </View>
        </LinearGradient>
        <View style={s.howToCard}><Text style={s.howToTitle}>💡 {t('howToEarn')}</Text><Text style={s.howToText}>{t('scanAndEarn')} · Each correct scan = 5–50 coins</Text></View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('rewardStore')}</Text>
          <View style={s.rewardGrid}>
            {REWARDS.map(reward=>(
              <TouchableOpacity key={reward.id} style={[s.rewardCard, ecoCoins<reward.cost&&s.rewardCardDisabled]} onPress={()=>handleRedeem(reward)}>
                <View style={[s.rewardIconBg,{backgroundColor:reward.color+'22'}]}><Text style={s.rewardIcon}>{reward.icon}</Text></View>
                <Text style={s.rewardName}>{reward.name}</Text>
                <Text style={s.rewardDesc}>{reward.description}</Text>
                <View style={s.rewardCostRow}>
                  <Text style={[s.rewardCost,{color:ecoCoins>=reward.cost?C.yellow:C.lightGray}]}>🪙 {reward.cost}</Text>
                  <Text style={[s.redeemLabel,{color:ecoCoins>=reward.cost?C.green:C.lightGray}]}>{ecoCoins>=reward.cost?t('redeemNow'):`Need ${reward.cost-ecoCoins} more`}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('transactionHistory')}</Text>
          {loadingTxns?<ActivityIndicator color={C.yellow} style={{padding:20}}/>
            :transactions.length===0?<View style={s.emptyCard}><Text style={s.emptyText}>{t('noTransactions')}</Text></View>
            :transactions.map(txn=>(
              <View key={txn.id} style={s.txnCard}>
                <View style={[s.txnIconBg,{backgroundColor:txn.type==='earn'?'#1A3A1F':'#3A1A00'}]}><Text style={s.txnIcon}>{txn.type==='earn'?'↑':'↓'}</Text></View>
                <View style={s.txnInfo}><Text style={s.txnReason}>{txn.reason}</Text><Text style={s.txnTime}>{formatTime(txn.created_at)}</Text></View>
                <Text style={[s.txnAmount,{color:txn.type==='earn'?C.green:C.orange}]}>{txn.type==='earn'?'+':'-'}{txn.amount}</Text>
              </View>
            ))}
        </View>
        <View style={{height:100}}/>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg},
  header:{padding:24,paddingTop:Platform.OS==='android'?50:60,alignItems:'center'},
  headerTitle:{color:C.lightGray,fontSize:13,letterSpacing:3,textTransform:'uppercase'},
  coinsDisplay:{color:C.yellow,fontSize:72,fontWeight:'900',marginTop:8},
  coinsSubtitle:{color:C.lightGray,fontSize:12,letterSpacing:6,marginTop:-8},
  statsRow:{flexDirection:'row',alignItems:'center',marginTop:20,backgroundColor:C.card,borderRadius:14,padding:14,width:'100%'},
  statItem:{flex:1,alignItems:'center'}, statValue:{color:C.white,fontSize:18,fontWeight:'700'}, statLabel:{color:C.lightGray,fontSize:10,marginTop:2},
  statDivider:{width:1,height:30,backgroundColor:'#444'},
  howToCard:{marginHorizontal:16,marginTop:12,backgroundColor:'#1A2800',borderRadius:12,padding:14,borderLeftWidth:4,borderLeftColor:C.yellow},
  howToTitle:{color:C.yellow,fontSize:13,fontWeight:'700',marginBottom:4}, howToText:{color:C.white,fontSize:12,lineHeight:18},
  section:{padding:16,paddingBottom:0}, sectionTitle:{color:C.white,fontSize:16,fontWeight:'700',marginBottom:12,letterSpacing:1},
  rewardGrid:{gap:10},
  rewardCard:{backgroundColor:C.card,borderRadius:14,padding:16,borderWidth:1,borderColor:'#333'}, rewardCardDisabled:{opacity:0.6},
  rewardIconBg:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',marginBottom:10}, rewardIcon:{fontSize:24},
  rewardName:{color:C.white,fontSize:15,fontWeight:'700',marginBottom:4}, rewardDesc:{color:C.lightGray,fontSize:12,lineHeight:16,marginBottom:10},
  rewardCostRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  rewardCost:{fontSize:14,fontWeight:'700'}, redeemLabel:{fontSize:12,fontWeight:'600'},
  emptyCard:{backgroundColor:C.card,borderRadius:14,padding:24,alignItems:'center'}, emptyText:{color:C.lightGray,fontSize:14},
  txnCard:{backgroundColor:C.card,borderRadius:12,padding:14,flexDirection:'row',alignItems:'center',marginBottom:8,gap:12},
  txnIconBg:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'}, txnIcon:{color:C.white,fontSize:16,fontWeight:'700'},
  txnInfo:{flex:1}, txnReason:{color:C.white,fontSize:13,fontWeight:'600'}, txnTime:{color:C.lightGray,fontSize:11,marginTop:2},
  txnAmount:{fontSize:16,fontWeight:'800'},
});
