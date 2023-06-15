const spots = [...document.getElementsByClassName('spot')];
const grid = document.querySelector('.grid');
const spots_borders = document.querySelector('.spots-borders');
const final_result_element = document.querySelector('.final_result');
const final_result_state = final_result_element.querySelector(`.state`);

const GRID_SIZE = 3;
const PLAYER_X = 'X';
const PLAYER_O = 'O';
const SPACE = '';
const LEFT = '0';
const CENTER = '1';
const RIGHT = '2';

const winning_patterns = [
    {
        pattern: [0, 1, 2],
        strike_line_properties: {
            'transform-origin': 'left',
            'rotate': '0deg',
            '--scale': '1 1',
            '--index': 0,
            '--is_horizontal': 1,
            '--is_vertical': 0
        }
    },
    {
        pattern: [3, 4, 5],
        strike_line_properties: {
            'transform-origin': 'left',
            'rotate': '0deg',
            '--scale': '1 1',
            '--index': 1,
            '--is_horizontal': 1,
            '--is_vertical': 0
        }
    },
    {
        pattern: [6, 7, 8],
        strike_line_properties: {
            'transform-origin': 'left',
            'rotate': '0deg',
            '--scale': '1 1',
            '--index': 2,
            '--is_horizontal': 1,
            '--is_vertical': 0
        }
    },
    {
        pattern: [0, 3, 6],
        strike_line_properties: {
            'transform-origin': 'left',
            'rotate': '90deg',
            '--scale': '1 1',
            '--index': 0,
            '--is_horizontal': 0,
            '--is_vertical': 1
        }
    },
    {
        pattern: [1, 4, 7],
        strike_line_properties: {
            'transform-origin': 'left',
            'rotate': '90deg',
            '--scale': '1 1',
            '--index': 1,
            '--is_horizontal': 0,
            '--is_vertical': 1
        }
    },
    {
        pattern: [2, 5, 8],
        strike_line_properties: {
            'transform-origin': 'left',
            'rotate': '90deg',
            '--scale': '1 1',
            '--index': 2,
            '--is_horizontal': 0,
            '--is_vertical': 1
        }
    },
    {
        pattern: [0, 4, 8],
        strike_line_properties: {
            'transform-origin': 'left',
            'rotate': '45deg',
            '--scale': '1.41421 1',
            '--index': 0,
            '--is_horizontal': 0,
            '--is_vertical': 0
        }
    },
    {
        pattern: [2, 4, 6],
        strike_line_properties: {
            'transform-origin': 'right',
            'rotate': '-45deg',
            '--scale': '1.41421 1',
            '--index': 0,
            '--is_horizontal': 0,
            '--is_vertical': 0
        }
    },
];

let board = [[]];
let board_elements = [[]];
let first_player = PLAYER_X;
let player_turn = first_player;
let is_game_over = false;
let is_interactive = false;
let win_pattern_index = -1;
let ai = first_player === PLAYER_X ? PLAYER_O : PLAYER_X;

const scores = {
    X: ai ? ai === PLAYER_X ? 1 : -1 : 1,
    O: ai ? ai === PLAYER_O ? 1 : -1 : -1,
    tie: 0
}

const init = async () => {
    board = [...new Array(GRID_SIZE)].map(() => {
        return new Array(GRID_SIZE).fill(SPACE);
    });

    board_elements = [...new Array(GRID_SIZE)].map(() => {
        return new Array(GRID_SIZE).fill(null);
    });

    spots.forEach((spot) => {
        spot.onclick = () => spot_onclick_action(spot);
    });

    spots_borders.classList.add('active');

    await wait_for(spots_borders);

    is_interactive = true;
};

const spot_onclick_action = async (spot) => {
    const spot_number = spot.dataset.number;
    const position = get_position(spot_number);

    if (is_game_over || !is_interactive || board[position.y][position.x])
        return;

    is_interactive = false;

    if (await turn(board, player_turn, position)) {
        console.log('done');
        return;
    }

    if (ai && await ai_move(board, player_turn)) {
        console.log('done');
        return;
    }

    is_interactive = true;
};

const ai_move = async (board, player) => {
    const position = best_move(board, player);

    return await turn(board, player, position);
}

const turn = async (board, player, position) => {
    await move_player(player, position);
    const result = await evaluate_board(board, player);

    if (result === scores.tie)
        await tie();

    if (result === scores[player])
        await win(player);

    if (result === scores.tie || result === scores[player]) {
        is_game_over = true;
        return true;
    }

    player_turn = player === PLAYER_X ? PLAYER_O : PLAYER_X;

    return false;
}

const move_player = async (player, position) => {
    const player_element = draw_player_element(player);

    board[position.y][position.x] = player;
    board_elements[position.y][position.x] = player_element;

    set_element_position(player_element, {...position});

    grid.append(player_element);

    await wait_for(player_element, true);
}

const evaluate_board = (board, player) => {
    if (is_player_win(board, player))
        return scores[player];

    if (is_tie(board))
        return scores.tie;

    return null;
}

const win = async (player) => {
    const pattern = winning_patterns[win_pattern_index].pattern;
    const strike_line_properties = winning_patterns[win_pattern_index].strike_line_properties;
    const strike_line = draw_strike_line(strike_line_properties);
    const win_pattern_elements = get_winning_pattern_elements(pattern);
    const win_player_element = draw_player_element(player);

    grid.append(strike_line);

    await wait_for(strike_line, true);

    win_pattern_elements.forEach((element) => {
        set_element_position(element, {y: CENTER, x: CENTER});
    });

    shrink_strike_line(strike_line, strike_line_properties);

    await wait_for(strike_line);

    strike_line.remove();
    win_pattern_elements.forEach((element) => element.remove());

    grid.classList.add('inactive');

    final_result_element.classList.add('active');

    final_result_element.append(win_player_element);

    final_result_state.innerText = 'winner!';

    await wait_for(win_player_element, true);
}

const tie = async () => {
    const X_element = draw_player_element(PLAYER_X);
    const O_element = draw_player_element(PLAYER_O);

    grid.classList.add('inactive');

    final_result_element.classList.add('active');

    final_result_element.append(X_element, O_element);

    set_element_position(X_element, {y: CENTER, x: RIGHT});
    set_element_position(O_element, {y: CENTER, x: LEFT});

    if (board_elements[CENTER][RIGHT])
        board_elements[CENTER][RIGHT].remove();

    if (board_elements[CENTER][LEFT])
        board_elements[CENTER][LEFT].remove();

    final_result_state.innerText = 'draw!';

    await wait_for(X_element, true);
}

const draw_player_element = (player) => {
    const player_element = document.createElement("span");

    player_element.classList.add(player);

    return player_element;
}

const is_player_win = (board, player) => {
    for (let i = 0; i < winning_patterns.length; i++) {
        const pattern = winning_patterns[i].pattern;

        if (is_player_win_pattern(board, pattern, player)) {
            win_pattern_index = i;
            return true;
        }
    }

    return false;
}

const shrink_strike_line = (line, properties) => {
    line.style.setProperty('--index', CENTER);
    line.style.setProperty('width', '0');
    line.style.setProperty('opacity', '0');

    (!properties['--is_horizontal']) ? line.style.top = '50%' : null;
    (!properties['--is_vertical']) ? line.style.left = '50%' : null;
}

const set_element_position = (element, position) => {
    element.style.setProperty('--y', position.y);
    element.style.setProperty('--x', position.x);
}

const draw_strike_line = (properties) => {
    const line = document.createElement("span");

    line.classList.add('strike_line');

    for (const key in properties)
        line.style.setProperty(key, properties[`${key}`]);

    line.style.backgroundColor = player_turn === PLAYER_X ? 'var(--X_color)' : 'var(--O_color)';

    return line;
}

const get_winning_pattern_elements = (pattern) => {
    const player_elements = [];

    for (let i = 0; i < GRID_SIZE; i++) {
        const spot_number = pattern[i];
        const position = get_position(spot_number);
        const element = board_elements[position.y][position.x];

        player_elements.push(element);
    }

    return player_elements;
};

const is_player_win_pattern = (board, pattern, player) => {
    for (let i = 0; i < GRID_SIZE; i++) {
        const spot_number = pattern[i];
        const position = get_position(spot_number);

        if (board[position.y][position.x] !== player)
            return false;
    }

    return true;
};

const get_position = (spot_number) => {
    const y = Math.floor(spot_number / GRID_SIZE);
    const x = spot_number % GRID_SIZE;

    return {y, x};
};

const is_tie = (board) => {
    return !(player_can_win(PLAYER_X, board) || player_can_win(PLAYER_O, board));
}

const player_can_win = (player, board) => {
    const against_player = player === PLAYER_X ? PLAYER_O : PLAYER_X;

    for (let i = 0; i < winning_patterns.length; i++) {
        const pattern = winning_patterns[i].pattern;

        if (player_can_win_pattern(board, pattern, against_player))
            return true;

    }

    return false;
}

const wait_for = (element, animation = false) => {
    return new Promise((resolve) => {
        element.addEventListener(animation ? "animationend" : "transitionend", () => {
            resolve();
        }, {once: true});
    });
};

const player_can_win_pattern = (board, pattern, against_player) => {
    for (let i = 0; i < GRID_SIZE; i++) {
        const position = get_position(pattern[i]);

        if (board[position.y][position.x] === against_player)
            return false;
    }

    return true;
}

const best_move = (board, player) => {
    let best_score = -Infinity;
    let best_move;

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === SPACE) {
                let score;

                board[i][j] = player;
                score = minimax(board, false);
                board[i][j] = SPACE;

                if (score >= best_score) {
                    best_move = {y: i, x: j};
                    best_score = score;
                }
            }
        }
    }

    return best_move;
}

const minimax = (board, is_maximize) => {
    const player = is_maximize ? ai : ai === PLAYER_X ? PLAYER_O : PLAYER_X;
    let best_score = is_maximize ? -Infinity : Infinity;

    if (is_player_win(board, player))
        return scores[player];

    if (is_tie(board))
        return scores.tie;

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === SPACE) {
                let score;

                board[i][j] = player;
                score = minimax(board, !is_maximize);
                board[i][j] = SPACE;

                if (is_maximize)
                    best_score = Math.max(best_score, score);
                else
                    best_score = Math.min(best_score, score);
            }
        }
    }

    return best_score;
}

init().then(() => console.log("ready"));