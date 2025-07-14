 export type HoleData = {
    hole_number: number;
    length: number;
    par: number;
    scores: {
      c2attempted: boolean;
      c1attempted: boolean;
      playerName: string;
      strokes: number;
      fairwayHit: boolean;
      c1made: boolean;
      c2made: boolean;
    }[];
  };
  
  export type Player = {
    name: string;
    is_guest: boolean;
  };
  
  export type PlayerStats = {
    [playerName: string]: {
      strokes: number;
      fairwayHit: boolean;
      c1made: boolean;
      c1attempted: boolean;
      c2made: boolean;
      c2attempted: boolean;
    };
  };