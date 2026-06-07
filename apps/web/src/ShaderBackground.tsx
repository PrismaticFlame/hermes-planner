import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;

// Hermes palette
const vec3 C_DEEP    = vec3(0.06, 0.03, 0.12);
const vec3 C_VIOLET  = vec3(0.30, 0.18, 0.55);
const vec3 C_MAGENTA = vec3(0.88, 0.25, 0.54);
const vec3 C_GOLD    = vec3(0.96, 0.73, 0.26);

void main() {
    float mr = min(iResolution.x, iResolution.y);
    vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / mr;

    float d = -iTime * 0.5;
    float a = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
        a += cos(i - d - a * uv.x);
        d += sin(uv.y * i + a);
    }
    d += iTime * 0.5;

    float t = 0.5 + 0.5 * cos(a + d);
    vec3 col = mix(C_DEEP,   C_VIOLET,  smoothstep(0.00, 0.45, t));
    col      = mix(col,      C_MAGENTA, smoothstep(0.40, 0.75, t));
    col      = mix(col,      C_GOLD,    smoothstep(0.70, 1.00, t));
    gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(sh) ?? "shader compile error");
    return sh;
}

export function ShaderBackground({ speed }: { speed: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const speedRef = useRef(speed);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext("webgl");
        if (!gl) return;

        const program = gl.createProgram()!;
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return;
        }
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1 , 1, 1,
        ]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const uRes = gl.getUniformLocation(program, "iResolution");
        const uTime = gl.getUniformLocation(program, "iTime");

        const SCALE = 0.65; // render below native res for performance
        function resize() {
            const w = window.innerWidth, h = window.innerHeight;
            canvas!.width = Math.floor(w * SCALE);
            canvas!.height = Math.floor(h * SCALE);
            canvas!.style.width = w + "px";
            canvas!.style.height = h + "px";
            gl!.viewport(0, 0, canvas!.width, canvas!.height);
            gl!.uniform2f(uRes, canvas!.width, canvas!.height);
        }
        resize();
        window.addEventListener("resize", resize);

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let raf = 0;
        let last = performance.now();
        let shaderTime = 0;
        const frame = (now: number) => {
            const dt = (now - last) / 1000;
            last = now;
            shaderTime += dt * speedRef.current;
            gl.uniform1f(uTime, shaderTime);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            raf = requestAnimationFrame(frame);
        };
        if (reduce) {
            gl.uniform1f(uTime, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        } else {
            raf = requestAnimationFrame(frame);
        }

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="shader-bg" aria-hidden="true" />;
}