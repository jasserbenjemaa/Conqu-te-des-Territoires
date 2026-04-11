class Piece {
  constructor(type, color) {
    this.type = type;
    this.color = color;
    this.animation = "idle";
    this.id = Math.random().toString(36).slice(2);
  }
  sprite() {
    return {
      blue: {
        l: {
          attack:
            "assets/Units Sprites/Blue Units/Lancer/Lancer_Right_Attack.png",
          idle: "assets/Units Sprites/Blue Units/Lancer/Lancer_Idle.png",
          move: "assets/Units Sprites/Blue Units/Lancer/Lancer_Run.png",
        },
        m: {
          attack: "assets/Units Sprites/Blue Units/Monk/Heal.png",
          idle: "assets/Units Sprites/Blue Units/Lancer/Idle.png",
          move: "assets/Units Sprites/Blue Units/Lancer/Run.png",
        },
        w: {
          attack: "assets/Units Sprites/Blue Units/Warrior/Warrior_Attack.png",
          idle: "assets/Units Sprites/Blue Units/Warrior/Warrior_Idle.png",
          move: "assets/Units Sprites/Blue Units/Warrior/Warrior_Run.png",
        },
      },
      red: {},
    }[this.color][this.type][this.animation];
  }
  name() {
    return {
      w: "Warrior",
      l: "Lancer",
      m: "Monk",
    }[this.type];
  }
  setAnimation(anim) {
    this.animation = anim;
  }
}

class Animation {}
