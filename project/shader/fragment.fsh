precision mediump float;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
varying vec3 v_color;
varying vec2 v_texcoord;

uniform mediump int u_mode;
uniform vec3 u_lightColor;
uniform vec3 u_ambient;
uniform vec3 u_diffuse;
uniform vec3 u_specular;
uniform float u_shininess;
uniform sampler2D u_texture;

void main(void) {

    if (u_mode == 0) {

        vec3 normal = normalize(v_normal);
        vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
        float diffuse = max(dot(normal, surfaceToLightDirection), 0.0);
        float specular = 0.0;
        if (diffuse > 0.0) {
            vec3 surfaceToViewDirection = normalize(v_surfaceToView);
            vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
            specular = pow(dot(normal, halfVector), u_shininess);
        }

        vec4 ambientFactor = vec4(u_ambient * v_color, 1.0) * texture2D(u_texture, v_texcoord);
        vec4 diffuseFactor = vec4(u_lightColor * u_diffuse * v_color, 1.0) * texture2D(u_texture, v_texcoord);
        vec4 specularFactor = vec4(u_lightColor * u_specular, 1.0);

        gl_FragColor = ambientFactor + diffuseFactor * diffuse + specularFactor * specular;

    } else {

        gl_FragColor = vec4(v_color, 1.0) * texture2D(u_texture, v_texcoord);

    }

}
