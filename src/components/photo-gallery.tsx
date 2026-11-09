import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { photoUrl } from '@/lib/supabase-config';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { CarFront } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

/** Swipeable full-width photos with page dots. */
export function PhotoGallery({ photos }: { photos: string[] }) {
  const [width, setWidth] = React.useState(0);
  const [index, setIndex] = React.useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setIndex(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / width));
  };

  if (!photos.length) {
    return (
      <View className="bg-muted aspect-[4/3] w-full items-center justify-center">
        <Icon as={CarFront} size={72} className="text-muted-foreground/40" />
      </View>
    );
  }

  return (
    <View className="bg-muted aspect-[4/3] w-full" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          {photos.map((p) => (
            <Image
              key={p}
              source={{ uri: photoUrl(p) }}
              style={{ width, height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ))}
        </ScrollView>
      ) : null}
      {photos.length > 1 ? (
        <>
          <View className="absolute inset-x-0 bottom-3 flex-row justify-center gap-1.5">
            {photos.map((p, i) => (
              <View key={p} className={cn('h-1.5 rounded-full bg-white/60', i === index ? 'w-5 bg-white' : 'w-1.5')} />
            ))}
          </View>
          <View className="absolute end-3 top-3 rounded-full bg-black/60 px-2 py-0.5">
            <Text className="text-xs font-medium text-white">
              {index + 1}/{photos.length}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
