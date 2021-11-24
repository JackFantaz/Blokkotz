attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_color;
attribute vec2 a_texcoord;

uniform mediump int u_mode;
uniform vec3 u_lightPosition;
uniform vec3 u_viewPosition;
uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

uniform mediump vec3 u_lightColor;
uniform mediump vec3 u_ambient;
uniform mediump vec3 u_diffuse;
uniform mediump vec3 u_specular;
uniform mediump float u_shininess;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
varying vec3 v_color;
varying vec2 v_texcoord;

void main(void) {

    vec4 position = vec4(a_position, 1.0);
    v_normal = mat3(u_worldInverseTranspose) * a_normal;
    vec3 surfacePosition = (u_world * position).xyz;

    v_surfaceToLight = u_lightPosition - surfacePosition;
    v_surfaceToView = u_viewPosition - surfacePosition;

    v_color = a_color;
    v_texcoord = a_texcoord;
    gl_Position = u_worldViewProjection * position;

    if (u_mode == 1) {

        vec3 normal = normalize(v_normal);
        vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
        float diffuse = max(dot(normal, surfaceToLightDirection), 0.0);
        float specular = 0.0;
        if (diffuse > 0.0) {
            vec3 surfaceToViewDirection = normalize(v_surfaceToView);
            vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
            specular = pow(dot(normal, halfVector), u_shininess);
        }

        vec4 ambientFactor = vec4(u_ambient * v_color, 1.0);
        vec4 diffuseFactor = vec4(u_lightColor * u_diffuse * v_color, 1.0);
        vec4 specularFactor = vec4(u_lightColor * u_specular, 1.0);

        v_color = (ambientFactor + diffuseFactor * diffuse + specularFactor * specular).xyz;

    }

}
