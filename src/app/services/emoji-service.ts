import { Injectable } from '@angular/core';
import data from '@emoji-mart/data';
import { init, SearchIndex } from 'emoji-mart';

@Injectable({
  providedIn: 'root',
})
export class EmojiService {

  constructor() {
    init({ data });
  }

  emojiData = data;

  searchedData = async (value: string) => {
    const emojis = await SearchIndex.search(value);
    return emojis;
  };
}
