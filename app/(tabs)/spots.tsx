import React, { useEffect } from 'react';
import { FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { View } from '@/components/Themed';
import { SpotCard } from '@/components/SpotCard';
import { SpotConditions } from '@/components/SpotConditions';
import { useSpotStore, useSelectedSpot } from '@/stores/useSpotStore';
import { useTideStore } from '@/stores/useTideStore';
import { useConditionsStore } from '@/stores/useConditionsStore';

export default function SpotsScreen() {
  const { spots, selectedSpotId, loading, fetchSpots, selectSpot } =
    useSpotStore();
  const selectedSpot = useSelectedSpot();
  const {
    fetchTides,
    predictions,
    hiLo,
    loading: tidesLoading,
  } = useTideStore();
  const {
    fetchConditions,
    swell,
    wind,
    loading: conditionsLoading,
  } = useConditionsStore();

  useEffect(() => {
    fetchSpots();
  }, []);

  // When selected spot changes, fetch its data
  useEffect(() => {
    if (!selectedSpot) return;

    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    if (selectedSpot.noaa_station_id) {
      fetchTides(selectedSpot.noaa_station_id, now, weekFromNow);
    }
    fetchConditions(selectedSpot.lat, selectedSpot.lng);
  }, [selectedSpotId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={spots}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SpotCard
            spot={item}
            selected={item.id === selectedSpotId}
            onPress={() => selectSpot(item.id)}
          />
        )}
        contentContainerStyle={styles.spotList}
      />
      <SpotConditions
        predictions={predictions}
        hiLo={hiLo}
        swell={swell}
        wind={wind}
        loading={tidesLoading || conditionsLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
