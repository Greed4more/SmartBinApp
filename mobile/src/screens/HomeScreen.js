import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

const COLORS = { bg:'#1A1A18', yellow:'#E8C547', orange:'#C4622D', white:'#F5F0E8', gray:'#2A2A28', card:'#252523', lightGray:'#888884', green:'#4A7C4E', blue:'#3A5A8C' };
const catColors = { dry:COLORS.yellow, wet:COLORS.green, metal:COLORS.blue, plastic:COLORS.orange, ewaste:'#9B59B6', unknown:COLORS.lightGray };

export default function HomeScreen() {
  const { t, userProfile, ecoCoins, totalScans, recentScans, binData } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };
  const getBinColor = (l) => l >= 80 ? '#E74C3C' : l >= 60 ? COLORS.orange : l >= 40 ? COLORS.yellow : COLORS.green;
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((new Date() - d) / 60000);
    if (diff < 1) return 'Just now'; if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`; return d.toLocaleDateString();
  };
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.yellow} />}>
        <LinearGradient colors={['#2A2A28', COLORS.bg]} style={s.header}>
          <View><Text style={s.greeting}>{t('welcomeBack')},</Text><Text style={s.userName}>{userProfile?.name || 'Eco Warrior'}</Text></View>
          <View style={s.activeBadge}><View style={s.activeDot}/><Text style={s.activeText}>{t('smartbinActive')}</Text></View>
        </LinearGradient>
        <View style={s.statsRow}>
          {[{v:totalScans,l:t('totalScans'),c:COLORS.white},{v:ecoCoins,l:t('ecoCoins'),c:COLORS.yellow},{v:(userProfile?.co2Saved||0).toFixed(1),l:`${t('co2Saved')} (kg)`,c:COLORS.green}].map((st,i)=>(
            <View key={i} style={[s.statCard, i===1&&{borderColor:COLORS.yellow}]}><Text style={[s.statValue,{color:st.c}]}>{st.v}</Text><Text style={s.statLabel}>{st.l}</Text></View>
          ))}
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('binStatus')}</Text>
          <View style={s.binCard}>
            {[{key:'dry',icon:'🌿'},{key:'wet',icon:'💧'},{key:'metal',icon:'⚙️'}].map(({key,icon})=>{
              const level = binData?.[key]||0;
              return (
                <View key={key} style={s.binItem}>
                  <View style={s.binLabelRow}><Text style={s.binIcon}>{icon}</Text><Text style={s.binLabel}>{t(key)}</Text><Text style={[s.binPercent,{color:getBinColor(level)}]}>{level}%</Text></View>
                  <View style={s.binTrack}><View style={[s.binFill,{width:`${level}%`,backgroundColor:getBinColor(level)}]}/></View>
                  {level>=80&&<Text style={s.fullAlert}>⚠️ {t('alertFull')}</Text>}
                </View>
              );
            })}
          </View>
        </View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('recentActivity')}</Text>
          {recentScans.length===0 ? <View style={s.emptyCard}><Text style={s.emptyText}>{t('noActivity')}</Text></View>
            : recentScans.map((scan)=>(
              <View key={scan.id} style={s.activityCard}>
                <View style={[s.activityIcon,{backgroundColor:(catColors[scan.category]||COLORS.lightGray)+'33'}]}><Text style={s.activityIconText}>{scan.category==='dry'?'🌿':scan.category==='wet'?'💧':scan.category==='metal'?'⚙️':scan.category==='plastic'?'♻️':'🗑️'}</Text></View>
                <View style={s.activityInfo}><Text style={s.activityName}>{scan.itemName||'Waste Item'}</Text><Text style={s.activityTime}>{formatTime(scan.timestamp)}</Text></View>
                <View style={s.activityCoins}><Text style={s.activityCoinsText}>+{scan.ecoCoinsEarned||0}</Text><Text style={s.activityCoinsLabel}>coins</Text></View>
                <View style={[s.categoryBadge,{backgroundColor:catColors[scan.category]||COLORS.lightGray}]}><Text style={s.categoryBadgeText}>{scan.category?.toUpperCase()}</Text></View>
              </View>
            ))}
        </View>
        <View style={{height:100}}/>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:24,paddingTop:Platform.OS==='android'?50:60},
  greeting:{color:COLORS.lightGray,fontSize:14}, userName:{color:COLORS.white,fontSize:24,fontWeight:'800'},
  activeBadge:{flexDirection:'row',alignItems:'center',backgroundColor:'#1A3A1F',paddingHorizontal:12,paddingVertical:8,borderRadius:20,gap:6},
  activeDot:{width:8,height:8,borderRadius:4,backgroundColor:'#4CAF50'}, activeText:{color:'#4CAF50',fontSize:11,fontWeight:'600'},
  statsRow:{flexDirection:'row',gap:10,paddingHorizontal:16,marginBottom:8},
  statCard:{flex:1,backgroundColor:COLORS.card,borderRadius:14,padding:16,alignItems:'center',borderWidth:1,borderColor:'#333'},
  statValue:{color:COLORS.white,fontSize:22,fontWeight:'800'}, statLabel:{color:COLORS.lightGray,fontSize:10,marginTop:4,textAlign:'center'},
  section:{paddingHorizontal:16,marginTop:16},
  sectionTitle:{color:COLORS.white,fontSize:16,fontWeight:'700',marginBottom:10,letterSpacing:1},
  binCard:{backgroundColor:COLORS.card,borderRadius:16,padding:16,gap:16}, binItem:{},
  binLabelRow:{flexDirection:'row',alignItems:'center',marginBottom:8,gap:6},
  binIcon:{fontSize:16}, binLabel:{flex:1,color:COLORS.white,fontSize:14,fontWeight:'600'}, binPercent:{fontSize:14,fontWeight:'700'},
  binTrack:{height:10,backgroundColor:'#333',borderRadius:5,overflow:'hidden'}, binFill:{height:'100%',borderRadius:5},
  fullAlert:{color:'#E74C3C',fontSize:11,marginTop:4},
  emptyCard:{backgroundColor:COLORS.card,borderRadius:16,padding:24,alignItems:'center'}, emptyText:{color:COLORS.lightGray,fontSize:14,textAlign:'center'},
  activityCard:{backgroundColor:COLORS.card,borderRadius:14,padding:14,flexDirection:'row',alignItems:'center',marginBottom:10,gap:12},
  activityIcon:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'}, activityIconText:{fontSize:20},
  activityInfo:{flex:1}, activityName:{color:COLORS.white,fontSize:14,fontWeight:'600'}, activityTime:{color:COLORS.lightGray,fontSize:12,marginTop:2},
  activityCoins:{alignItems:'center'}, activityCoinsText:{color:COLORS.yellow,fontSize:16,fontWeight:'800'}, activityCoinsLabel:{color:COLORS.lightGray,fontSize:10},
  categoryBadge:{paddingHorizontal:10,paddingVertical:4,borderRadius:8}, categoryBadgeText:{fontSize:9,fontWeight:'800',color:COLORS.bg},
});
