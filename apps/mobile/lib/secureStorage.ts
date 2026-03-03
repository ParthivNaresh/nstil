import * as SecureStore from "expo-secure-store";

const CHUNK_SIZE = 2000;

function chunkKey(key: string, index: number): string {
  return `${key}__chunk_${index}`;
}

function metaKey(key: string): string {
  return `${key}__meta`;
}

async function getItem(key: string): Promise<string | null> {
  const meta = await SecureStore.getItemAsync(metaKey(key));

  if (meta === null) {
    return SecureStore.getItemAsync(key);
  }

  const count = parseInt(meta, 10);
  if (isNaN(count) || count <= 0) {
    return null;
  }

  const chunks: string[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = await SecureStore.getItemAsync(chunkKey(key, i));
    if (chunk === null) {
      return null;
    }
    chunks.push(chunk);
  }

  return chunks.join("");
}

async function setItem(key: string, value: string): Promise<void> {
  const existingMeta = await SecureStore.getItemAsync(metaKey(key));
  if (existingMeta !== null) {
    await removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key).catch(() => {});
  }

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, index), chunk)),
  );

  await SecureStore.setItemAsync(metaKey(key), String(chunks.length));
}

async function removeItem(key: string): Promise<void> {
  const meta = await SecureStore.getItemAsync(metaKey(key));

  if (meta !== null) {
    const count = parseInt(meta, 10);
    if (!isNaN(count)) {
      await Promise.all(
        Array.from({ length: count }, (_, i) =>
          SecureStore.deleteItemAsync(chunkKey(key, i)),
        ),
      );
    }
    await SecureStore.deleteItemAsync(metaKey(key));
  }

  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  getItem,
  setItem,
  removeItem,
};
